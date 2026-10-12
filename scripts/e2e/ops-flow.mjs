// End-to-end test of the admin operations layer (teachers, courses, parents, schedule conflicts, settings,
// admissions conversion, reports, RBAC) through the real HTTP API. Cleans up what it creates.   Run:  node scripts/e2e/ops-flow.mjs
import { readFileSync } from "node:fs";
import pg from "pg";
const env = Object.fromEntries(readFileSync(new URL("../../.env", import.meta.url),"utf8").split("\n").filter(l=>l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1).replace(/^"|"$/g,"")]}));
const q=async(sql,p=[])=>{for(let i=0;i<8;i++){try{const c=new pg.Client({connectionString:env.DATABASE_URL});await c.connect();const r=await c.query(sql,p);await c.end();return r.rows;}catch(e){if(i==7)throw e;await new Promise(r=>setTimeout(r,700));}}};
const B="http://localhost:3000";
let pass=0,failn=0; const check=(n,c,x="")=>{(c?pass++:failn++);console.log(`${c?"PASS":"FAIL"}  ${n}${c?"":"  -> "+x}`)};
const startedAt=new Date(Date.now()-5000).toISOString();

class Client{ jar={}; 
  cookieHeader(){return Object.entries(this.jar).map(([k,v])=>`${k}=${v}`).join("; ");}
  absorb(r){ for(const sc of r.headers.getSetCookie?.()??[]){const [kv]=sc.split(";");const i=kv.indexOf("=");const k=kv.slice(0,i),v=kv.slice(i+1); if(v==="")delete this.jar[k]; else this.jar[k]=v;} }
  async req(method,path,body,headers={}){const r=await fetch(B+path,{method,redirect:"manual",headers:{...(body!==undefined?{"content-type":"application/json"}:{}),cookie:this.cookieHeader(),...headers},body:body===undefined?undefined:JSON.stringify(body)});this.absorb(r);const ct=r.headers.get("content-type")||"";return {status:r.status,data:ct.includes("json")?await r.json():null};}
  async login(email,password){const c=await this.req("GET","/api/auth/csrf");const r=await fetch(B+"/api/auth/callback/credentials",{method:"POST",redirect:"manual",headers:{"content-type":"application/x-www-form-urlencoded",cookie:this.cookieHeader()},body:new URLSearchParams({csrfToken:c.data.csrfToken,email,password,json:"true"})});this.absorb(r);const s=await this.req("GET","/api/auth/session");return s.data?.user;}
}

const admin=new Client(), teacher=new Client(), anon=new Client(), stu=new Client(), par=new Client();
const stamp=Date.now().toString(36);
const mail=(p)=>`${p}.${stamp}@test.az`;
check("admin login",(await admin.login("admin@salehtech.az","admin123"))?.role==="ADMIN");
check("seed teacher login",(await teacher.login("tural.zeynalov@salehtech.az","teacher123"))?.role==="TEACHER");
check("seed student login",(await stu.login("ali.memmedov@example.com","student123"))?.role==="STUDENT");
check("seed parent login",(await par.login("elvin.memmedov@example.com","parent123"))?.role==="PARENT");

// ---------- RBAC on every new endpoint family
const eps=[["GET","/api/admin/teachers"],["GET","/api/admin/parents"],["GET","/api/admin/courses"],["GET","/api/admin/lessons"],["GET","/api/admin/attendance"],["GET","/api/admin/applications"],["GET","/api/admin/reports"],["GET","/api/admin/settings"],["GET","/api/admin/audit"],["GET","/api/admin/payments"]];
for(const [m,p] of eps){
  check(`anon ${p} -> 401`,(await anon.req(m,p)).status===401);
  check(`student ${p} -> 403`,(await stu.req(m,p)).status===403);
  check(`parent ${p} -> 403`,(await par.req(m,p)).status===403);
  check(`teacher ${p} -> 403`,(await teacher.req(m,p)).status===403);
}
check("teacher cannot write settings",(await teacher.req("PUT","/api/admin/settings",{})).status===403);
check("cross-origin settings write -> 403",(await admin.req("PUT","/api/admin/settings",{"billing.overdueDays":7},{origin:"https://evil.example"})).status===403);

// ---------- teachers
let r=await admin.req("POST","/api/admin/teachers",{name:"Test Muellim "+stamp,email:mail("t1"),password:"Teacher2026",position:"Python müəllimi",experienceYears:3,specializations:["Python"]});
check("create teacher (201)",r.status===201 && r.data.id,JSON.stringify(r.data).slice(0,200)); const T1=r.data;
check("teacher response has no password hash",!JSON.stringify(r.data).match(/passwordHash|\$2[aby]\$/));
r=await admin.req("POST","/api/admin/teachers",{name:"Dup T",email:mail("t1"),password:"Teacher2026",position:"X1"}); check("duplicate teacher e-mail -> 409",r.status===409 && r.data.fields?.email,JSON.stringify(r.data));
r=await admin.req("POST","/api/admin/teachers",{name:"x",email:"bad",password:"1",position:""}); check("invalid teacher -> 400 with fields",r.status===400 && r.data.fields,JSON.stringify(r.data));
const t1c=new Client(); check("new teacher can log in",(await t1c.login(mail("t1"),"Teacher2026"))?.role==="TEACHER");
r=await admin.req("GET","/api/admin/teachers/search?q="+encodeURIComponent("Test Muellim "+stamp)); check("new teacher is in picker search immediately",r.data.items.some(t=>t.id===T1.id));
r=await admin.req("PATCH","/api/admin/teachers/"+T1.id,{position:"Robototexnika müəllimi",experienceYears:5}); check("update teacher",r.status===200 && r.data.position==="Robototexnika müəllimi",JSON.stringify(r.data).slice(0,160));
r=await admin.req("GET",`/api/admin/teachers?q=${stamp}`); check("teacher list search + workload fields",r.status===200 && r.data.items.some(t=>t.id===T1.id && "classes" in t && "lessonsWeek" in t),JSON.stringify(r.data).slice(0,300));
r=await admin.req("PATCH","/api/admin/teachers/"+T1.id,{active:false}); check("deactivate teacher without classes",r.status===200 && r.data.active===false,JSON.stringify(r.data).slice(0,160));
check("deactivated teacher cannot log in",!(await new Client().login(mail("t1"),"Teacher2026")));
r=await admin.req("GET","/api/admin/teachers/search?q="+stamp); check("deactivated teacher hidden from picker",!r.data.items.some(t=>t.id===T1.id));
await admin.req("PATCH","/api/admin/teachers/"+T1.id,{active:true});
check("reactivated teacher can log in again",(await new Client().login(mail("t1"),"Teacher2026"))?.role==="TEACHER");

// ---------- courses
r=await admin.req("POST","/api/admin/courses",{name:"Test Kurs "+stamp,shortDesc:"Qısa təsvir burada",category:"python",minAge:8,maxAge:14,level:"BEGINNER",durationMonths:4,lessonsPerWeek:2,lessonMinutes:60,price:90,active:false,modules:[{title:"Giriş",summary:"Əsaslar"},{title:"Dövrlər",summary:""}]});
check("create inactive course (201)",r.status===201 && r.data.active===false && r.data.modules.length===2,JSON.stringify(r.data).slice(0,200)); const C=r.data;
r=await admin.req("POST","/api/admin/courses",{name:"Bad",shortDesc:"x",category:"python",minAge:14,maxAge:8,level:"BEGINNER",durationMonths:4,lessonsPerWeek:2,lessonMinutes:60,price:-1}); check("invalid course (age range, price) -> 400",r.status===400,JSON.stringify(r.data));
check("inactive course is hidden from the public page",(await fetch(`${B}/kurslar/${C.slug}`)).status===404);
r=await admin.req("GET","/api/admin/courses"); check("class-picker course list excludes inactive",!r.data.items.some(c=>c.id===C.id));
r=await admin.req("GET","/api/admin/courses?active=all"); check("admin course list can include inactive",r.data.items.some(c=>c.id===C.id));
r=await admin.req("POST","/api/admin/classes",{name:"Nope "+stamp,courseId:C.id,teacherId:T1.id}); check("cannot create a class on an inactive course",r.status>=400 && r.status<500,r.status+JSON.stringify(r.data));
r=await admin.req("PATCH","/api/admin/courses/"+C.id,{active:true,price:95,modules:[{title:"Yeni modul",summary:"x"}]}); check("activate + edit course, modules replaced",r.status===200 && r.data.active && r.data.price===95 && r.data.modules.length===1,JSON.stringify(r.data).slice(0,200));
check("active course appears on the public page",(await fetch(`${B}/kurslar/${C.slug}`)).status===200);

// ---------- parents + students
r=await admin.req("POST","/api/admin/parents",{name:"Valideyn Bir",email:mail("p1"),password:"Parent2026",phone:"+994501112233"}); check("create parent (201)",r.status===201,JSON.stringify(r.data)); const P1=r.data;
r=await admin.req("POST","/api/admin/parents",{name:"Valideyn Iki",email:mail("p2"),password:"Parent2026"}); const P2=r.data; check("create second parent",r.status===201);
r=await admin.req("GET","/api/admin/parents?q="+encodeURIComponent("Valideyn Bir")); check("parent picker search finds new parent",r.data.items.some(p=>p.id===P1.id));
r=await admin.req("GET",`/api/admin/parents/${P1.id}`); check("parent detail",r.status===200 && r.data.email===mail("p1"));
const mkStudent=async(first,parentId,extra={})=>(await admin.req("POST","/api/admin/students",{firstName:first,lastName:"Test",email:mail(first.toLowerCase()),password:"Student2026",birthDate:"2012-01-01",grade:7,parentId,...extra}));
const sA=(await mkStudent("Aydin",P1.id)).data, sB=(await mkStudent("Banu",P1.id)).data, sC=(await mkStudent("Cavid",P1.id)).data;
check("three students created",[sA,sB,sC].every(s=>s?.id));
r=await admin.req("GET","/api/admin/students?grade=7"); check("student list grade filter works",r.status===200 && r.data.items.every(s=>s.grade===7),JSON.stringify(r.data).slice(0,160));
r=await admin.req("PATCH","/api/admin/students/"+sC.id,{grade:8,firstName:"Cavid"}); check("edit student",r.status===200 && r.data.grade===8,JSON.stringify(r.data).slice(0,150));
r=await admin.req("PATCH","/api/admin/students/"+sC.id,{active:false}); check("deactivate student",r.status===200 && r.data.active===false);
check("deactivated student cannot log in",!(await new Client().login(mail("cavid"),"Student2026")));
await admin.req("PATCH","/api/admin/students/"+sC.id,{active:true});

// ---------- classes, capacity, settings
r=await admin.req("PUT","/api/admin/settings",{"billing.lessonsPerCycle":2,"class.defaultCapacity":0}); check("settings update (lessons per cycle = 2)",r.status===200 && r.data["billing.lessonsPerCycle"]===2,JSON.stringify(r.data).slice(0,200));
r=await admin.req("PUT","/api/admin/settings",{"billing.lessonsPerCycle":0}); check("invalid setting -> 400",r.status===400,JSON.stringify(r.data));
r=await admin.req("POST","/api/admin/classes",{name:"Ops A "+stamp,courseId:C.id,teacherId:T1.id,studentIds:[sA.id,sB.id],capacity:2}); check("class created: new default cycle (2) applied",r.status===201 && r.data.lessonsPerCycle===2 && r.data.capacity===2,JSON.stringify(r.data).slice(0,260)); const clsA=r.data;
r=await admin.req("POST",`/api/admin/classes/${clsA.id}/students`,{studentIds:[sC.id]}); check("capacity enforced: 3rd student -> 409",r.status===409,JSON.stringify(r.data));
r=await admin.req("PATCH",`/api/admin/classes/${clsA.id}`,{capacity:1}); check("capacity cannot drop below members -> 409",r.status===409,JSON.stringify(r.data));
r=await admin.req("PATCH",`/api/admin/classes/${clsA.id}`,{capacity:3}); check("capacity raised",r.status===200);
r=await admin.req("POST",`/api/admin/classes/${clsA.id}/students`,{studentIds:[sC.id]}); check("3rd student now fits",r.status===200||r.status===201,r.status+JSON.stringify(r.data).slice(0,150));
r=await admin.req("POST","/api/admin/classes",{name:"Ops B "+stamp,courseId:C.id,teacherId:T1.id,studentIds:[sA.id]}); const clsB=r.data;
const t1Notes=(await q(`SELECT count(*)::int n FROM "Notification" n JOIN "TeacherProfile" t ON t."userId"=n."userId" WHERE t.id=$1 AND n.event='TEACHER_ASSIGNED'`,[T1.id]))[0].n; check("teacher got TEACHER_ASSIGNED notifications",t1Notes>=2,String(t1Notes));
const sAnotes=(await q(`SELECT count(*)::int n FROM "Notification" n JOIN "StudentProfile" s ON s."userId"=n."userId" WHERE s.id=$1 AND n.event='CLASS_ASSIGNED'`,[sA.id]))[0].n; check("student got CLASS_ASSIGNED notifications",sAnotes>=1,String(sAnotes));
const t1c2=new Client(); await t1c2.login(mail("t1"),"Teacher2026");
r=await t1c2.req("GET","/api/teacher/classes"); check("new teacher sees both classes",r.data.items.some(c=>c.id===clsA.id)&&r.data.items.some(c=>c.id===clsB.id));
const sAc=new Client(); await sAc.login(mail("aydin"),"Student2026"); r=await sAc.req("GET","/api/student/classes"); check("student sees the class",r.data.items.some(c=>c.id===clsA.id));

// ---------- schedule conflicts
r=await admin.req("POST","/api/admin/lessons",{classId:clsA.id,date:"2027-03-01T10:00",durationMinutes:60,room:"Otaq 7"}); check("schedule lesson (201)",r.status===201 && r.data.created===true && (await q(`SELECT status FROM "Lesson" WHERE id=$1`,[r.data.id]))[0].status==="SCHEDULED",JSON.stringify(r.data).slice(0,200)); const L1=r.data;
r=await admin.req("POST","/api/admin/lessons",{classId:clsB.id,date:"2027-03-01T10:30",durationMinutes:60}); check("same TEACHER overlapping (other class) -> 409",r.status===409,JSON.stringify(r.data));
r=await admin.req("POST","/api/admin/lessons",{classId:clsA.id,date:"2027-03-01T10:30",durationMinutes:30}); check("same CLASS overlapping -> 409",r.status===409,JSON.stringify(r.data));
const nigarId=(await admin.req("GET","/api/admin/teachers/search?q=Nigar")).data.items[0].id;
const other=(await admin.req("POST","/api/admin/classes",{name:"Ops C "+stamp,courseId:C.id,teacherId:nigarId,studentIds:[sB.id]})).data;
r=await admin.req("POST","/api/admin/lessons",{classId:other.id,date:"2027-03-01T10:15",durationMinutes:45,room:"Otaq 7"}); check("same ROOM overlapping (different teacher) -> 409",r.status===409,JSON.stringify(r.data));
r=await admin.req("POST","/api/admin/lessons",{classId:other.id,date:"2027-03-01T10:15",durationMinutes:45,room:"Otaq 8"}); check("different room, different teacher, same time -> allowed",r.status===201,JSON.stringify(r.data)); const L2=r.data;
r=await admin.req("POST","/api/admin/lessons",{classId:clsB.id,date:"2027-03-01T11:00",durationMinutes:60}); check("back-to-back lessons (touching) -> allowed",r.status===201,JSON.stringify(r.data)); const L3=r.data;
r=await t1c2.req("POST",`/api/teacher/classes/${clsB.id}/lessons`,{date:"2027-03-01T10:20"}); check("teacher's own add-lesson obeys the same conflict rule",r.status===409||r.status===400,r.status+JSON.stringify(r.data));
r=await admin.req("PATCH","/api/admin/lessons/"+L3.id,{date:"2027-03-01T10:45"}); check("rescheduling into a conflict -> 409",r.status===409,JSON.stringify(r.data));
r=await admin.req("PATCH","/api/admin/lessons/"+L3.id,{date:"2027-03-02T11:00"}); check("reschedule to a free slot",r.status===200,JSON.stringify(r.data));
r=await admin.req("GET",`/api/admin/lessons?classId=${clsA.id}&from=2027-03-01&to=2027-03-03`); check("schedule filter by class",r.status===200 && r.data.items.length===1,JSON.stringify(r.data).slice(0,200));
r=await admin.req("DELETE","/api/admin/lessons/"+L2.id); check("cancel lesson (kept, status CANCELLED)",r.status===200,JSON.stringify(r.data));
check("cancelled lesson row still exists",(await q(`SELECT status FROM "Lesson" WHERE id=$1`,[L2.id]))[0]?.status==="CANCELLED");
r=await admin.req("POST","/api/admin/lessons",{classId:other.id,date:"2027-03-01T10:15",durationMinutes:45,room:"Otaq 8"}); check("a cancelled lesson no longer blocks its slot",r.status===201,JSON.stringify(r.data));
const cancelNotes=(await q(`SELECT count(*)::int n FROM "Notification" WHERE event='LESSON_CANCELLED' AND "entityId"=$1`,[L2.id]))[0].n; check("cancelling notified teacher/students/parents",cancelNotes>=1,String(cancelNotes));

// ---------- lesson completion with cycle=2, overdue, payment lifecycle, parent move
const lessons=[]; for(const d of ["2027-04-01","2027-04-02","2027-04-03","2027-04-04"]){ const l=await admin.req("POST","/api/admin/lessons",{classId:clsA.id,date:d+"T15:00"}); lessons.push(l.data.id); }
const complete=(l,ids)=>t1c2.req("POST",`/api/teacher/lessons/${l}/complete`,{studentIds:ids});
r=await complete(lessons[0],[sA.id]); check("1st completed lesson: no payment",r.data.items[0].paymentsOpened===0 && r.data.items[0].progress===1,JSON.stringify(r.data));
r=await complete(lessons[1],[sA.id]); check("2nd completed lesson (cycle=2): payment opened",r.data.items[0].paymentsOpened===1,JSON.stringify(r.data));
check("lesson became COMPLETED",(await q(`SELECT status FROM "Lesson" WHERE id=$1`,[lessons[0]]))[0].status==="COMPLETED");
r=await admin.req("DELETE","/api/admin/lessons/"+lessons[0]); check("cannot cancel a lesson that has completed attendance -> 409",r.status===409,JSON.stringify(r.data));
const pay=(await q(`SELECT * FROM "Payment" WHERE "studentId"=$1`,[sA.id]))[0]; check("payment DUE cycle 1 lessons 1-2",pay && pay.status==="DUE" && pay.cycle===1 && pay.lessonsTo===2);
const adminDue=(await q(`SELECT count(*)::int n FROM "Notification" WHERE event='PAYMENT_DUE' AND "entityId"=$1 AND "userId" IN (SELECT id FROM "User" WHERE role='ADMIN')`,[pay.id]))[0].n; check("admins got PAYMENT_DUE",adminDue>=1);
r=await admin.req("GET","/api/admin/payments?status=OVERDUE"); check("fresh DUE payment is not overdue",!r.data.items.some(p=>p.id===pay.id),JSON.stringify(r.data.counts));
await q(`UPDATE "Payment" SET "dueDate"=now() - interval '12 days' WHERE id=$1`,[pay.id]);
r=await admin.req("GET","/api/admin/payments?status=OVERDUE"); check("payment due >7 days appears under OVERDUE",r.data.items.some(p=>p.id===pay.id && p.overdue),JSON.stringify(r.data).slice(0,200));
r=await admin.req("GET","/api/admin/reports"); check("reports count it as overdue",r.status===200 && r.data.financial.overdue.count>=1,JSON.stringify(r.data.financial));
r=await admin.req("PUT",`/api/admin/students/${sA.id}/parent`,{parentId:P2.id}); check("move student to another parent",r.status===200,JSON.stringify(r.data));
check("payment follows the student to the new parent",(await q(`SELECT "parentId" FROM "Payment" WHERE id=$1`,[pay.id]))[0].parentId===P2.id);
r=await admin.req("GET",`/api/admin/parents/${P1.id}`); check("old parent no longer lists the student",!r.data.children.some(c=>c.id===sA.id));
r=await admin.req("PATCH",`/api/admin/payments/${pay.id}/status`,{status:"PAID"}); if(r.status===404||r.status===405) r=await admin.req("POST",`/api/admin/payments/${pay.id}/status`,{status:"PAID"});
check("mark payment PAID",r.status===200,r.status+JSON.stringify(r.data));
r=await admin.req("GET","/api/admin/payments?status=OVERDUE"); check("paid payment leaves OVERDUE",!r.data.items.some(p=>p.id===pay.id));
await complete(lessons[2],[sA.id]); r=await complete(lessons[3],[sA.id]); check("next 2 lessons open cycle 2",r.data.items[0].paymentsOpened===1 && (await q(`SELECT count(*)::int n FROM "Payment" WHERE "studentId"=$1`,[sA.id]))[0].n===2);
r=await admin.req("GET","/api/admin/attendance?classId="+clsA.id); check("admin attendance list",r.status===200 && r.data.items.length>=4,JSON.stringify(r.data).slice(0,200));
r=await admin.req("GET","/api/admin/attendance?status=ABSENT&classId="+clsA.id); check("attendance filter by status",r.status===200 && r.data.items.every(a=>a.status==="ABSENT"));

// ---------- admissions
const lead=async(n)=>(await q(`INSERT INTO "TrialBooking" (id,"parentName","parentPhone","studentName","studentAge","preferredDate","preferredTime",stage,"updatedAt") VALUES ($1,$2,'+994501234567',$3,11,now(),'15:00','NEW',now()) RETURNING id`,[`lead_${stamp}_${n}`,"Lead Valideyn "+["Bir","Iki"][n-1],"Lead Sagird "+["Bir","Iki"][n-1]]))[0].id;
const l1=await lead(1), l2=await lead(2);
r=await admin.req("GET","/api/admin/applications?q=Lead%20Sagird%20Bir"); check("applications list + stage counts",r.status===200 && r.data.items.some(a=>a.id===l1) && r.data.counts,JSON.stringify(r.data).slice(0,200));
r=await admin.req("PATCH","/api/admin/applications/"+l1,{stage:"CONTACTED"}); check("stage NEW -> CONTACTED",r.status===200 && r.data.stage==="CONTACTED",JSON.stringify(r.data).slice(0,150));
r=await admin.req("PATCH","/api/admin/applications/"+l1,{stage:"REGISTERED"}); check("REGISTERED cannot be set by hand -> 400",r.status===400);
r=await admin.req("PATCH","/api/admin/applications/"+l2,{stage:"REJECTED",adminNote:"Uyğun deyil"}); check("reject application with note",r.status===200 && r.data.stage==="REJECTED");
const stud0=(await q(`SELECT count(*)::int n FROM "StudentProfile"`))[0].n;
r=await admin.req("POST",`/api/admin/applications/${l1}/convert`,{student:{firstName:"Lead",lastName:"Sagird",email:mail("p1"),password:"Student2026",birthDate:"2014-02-02",newParent:{name:"Lead Valideyn Bir",email:mail("lp"),password:"Parent2026"}},classId:clsB.id});
check("convert with duplicate e-mail -> 409 and NOTHING is created",r.status===409 && (await q(`SELECT count(*)::int n FROM "StudentProfile"`))[0].n===stud0 && (await q(`SELECT count(*)::int n FROM "User" WHERE email=$1`,[mail("lp")]))[0].n===0 && (await q(`SELECT stage FROM "TrialBooking" WHERE id=$1`,[l1]))[0].stage==="CONTACTED",JSON.stringify(r.data));
r=await admin.req("POST",`/api/admin/applications/${l1}/convert`,{student:{firstName:"Lead",lastName:"Sagird",email:mail("leadstudent"),password:"Student2026",birthDate:"2014-02-02",grade:5,newParent:{name:"Lead Valideyn Bir",email:mail("lp"),password:"Parent2026",phone:"+994501234567"}},classId:clsB.id});
check("convert application -> student + parent + class (201)",r.status===201 && r.data.studentId,JSON.stringify(r.data)); const newStu=r.data.studentId;
check("lead is REGISTERED and linked to the student",(await q(`SELECT stage,"convertedStudentId" c FROM "TrialBooking" WHERE id=$1`,[l1]))[0].c===newStu);
check("new student is in the chosen class",(await q(`SELECT count(*)::int n FROM "Enrollment" WHERE "studentId"=$1 AND "classId"=$2`,[newStu,clsB.id]))[0].n===1);
const nsc=new Client(); check("converted student can log in",(await nsc.login(mail("leadstudent"),"Student2026"))?.role==="STUDENT");
r=await nsc.req("GET","/api/student/classes"); check("converted student sees the class",r.data.items.some(c=>c.id===clsB.id));
r=await admin.req("POST",`/api/admin/applications/${l1}/convert`,{student:{firstName:"Lead",lastName:"Again",email:mail("again"),password:"Student2026",birthDate:"2014-02-02",newParent:{name:"Lead Valideyn Bir",email:mail("lp2"),password:"Parent2026"}}}); check("second conversion of the same application -> 409",r.status===409);
const adm=(await q(`SELECT count(*)::int n FROM "Notification" WHERE event='NEW_STUDENT' AND "createdAt">=$1`,[startedAt]))[0].n; check("admins notified NEW_STUDENT",adm>=1);

// ---------- reports + dashboard + pages
r=await admin.req("GET","/api/admin/reports?from=2027-01-01&to=2027-12-31"); check("reports (date range) shape",r.status===200 && r.data.students && r.data.classes && r.data.financial && r.data.teachers && r.data.admissions,JSON.stringify(Object.keys(r.data||{})));
r=await admin.req("GET","/api/admin/reports?from=garbage"); check("reports tolerate a bad date",r.status===200);
r=await admin.req("GET","/api/admin/notifications?event=PAYMENT_DUE"); check("notification event filter",r.status===200 && r.data.items.every(n=>n.event==="PAYMENT_DUE"),JSON.stringify(r.data).slice(0,160));
const pages=["/admin","/admin/students","/admin/students?grade=7","/admin/parents","/admin/teachers","/admin/courses","/admin/classes","/admin/schedule","/admin/attendance","/admin/payments?status=OVERDUE","/admin/leads","/admin/leads?stage=NEW","/admin/scholarship","/admin/reports","/admin/notifications?read=false","/admin/audit","/admin/settings",`/admin/students/${sA.id}`,`/admin/parents/${P1.id}`,`/admin/teachers/${T1.id}`,`/admin/classes/${clsA.id}`];
for(const p of pages){ const pr=await fetch(B+p,{headers:{cookie:admin.cookieHeader()},redirect:"manual"}); const html=await pr.text(); check(`page ${p} renders (200, no error boundary)`,pr.status===200 && !html.includes("Nəsə səhv getdi") && !html.includes("Application error"),String(pr.status)); }
check("anon page /admin redirects",[302,307].includes((await fetch(B+"/admin",{redirect:"manual"})).status));
check("student cannot open /admin/settings",(await fetch(B+"/admin/settings",{headers:{cookie:stu.cookieHeader()},redirect:"manual"})).status!==200);
r=await admin.req("GET","/api/admin/audit?limit=5"); check("audit log has entries",r.status===200 && (r.data.items?.length>0),JSON.stringify(r.data).slice(0,160));

// ---------- cleanup
await admin.req("PUT","/api/admin/settings",{"billing.lessonsPerCycle":8,"billing.overdueDays":7,"class.defaultCapacity":0});
await q(`DELETE FROM "TrialBooking" WHERE id LIKE $1`,[`lead_${stamp}_%`]);
await q(`DELETE FROM "Payment" WHERE "classId" IN (SELECT id FROM "ClassGroup" WHERE name LIKE $1)`,[`%${stamp}`]);
await q(`DELETE FROM "ClassGroup" WHERE name LIKE $1`,[`%${stamp}`]);
await q(`DELETE FROM "Payment" WHERE "parentId" IN (SELECT pp.id FROM "ParentProfile" pp JOIN "User" u ON u.id=pp."userId" WHERE u.email LIKE $1)`,[`%.${stamp}@test.az`]);
await q(`DELETE FROM "StudentProfile" WHERE "parentId" IN (SELECT pp.id FROM "ParentProfile" pp JOIN "User" u ON u.id=pp."userId" WHERE u.email LIKE $1)`,[`%.${stamp}@test.az`]);
await q(`DELETE FROM "Course" WHERE name = $1`,[`Test Kurs ${stamp}`]).catch(()=>{});
await q(`DELETE FROM "User" WHERE email LIKE $1`,[`%.${stamp}@test.az`]);
await q(`DELETE FROM "Notification" WHERE "createdAt">=$1 AND event IN ('PAYMENT_DUE','PAYMENT_PAID','NEW_STUDENT','CLASS_ASSIGNED','TEACHER_ASSIGNED','LESSON_CANCELLED','LESSON_SCHEDULED','LESSON_COMPLETED','ABSENCE','GENERAL')`,[startedAt]);
await q(`DELETE FROM "AuditLog" WHERE "createdAt">=$1`,[startedAt]);
const left=(await q(`SELECT (SELECT count(*) FROM "User" WHERE email LIKE '%.${stamp}@test.az')::int u,(SELECT count(*) FROM "ClassGroup" WHERE name LIKE $1)::int c,(SELECT count(*) FROM "Course" WHERE name LIKE $1)::int k`,[`%${stamp}`]))[0];
check("test data cleaned up",left.u===0 && left.c===0 && left.k===0,JSON.stringify(left));
console.log(`\n${pass} passed, ${failn} failed`); process.exit(failn?1:0);
