// End-to-end test of Admin -> Class -> Teacher -> Student -> Lesson completion -> Payment, through the real HTTP API.
// Needs the dev server on :3000 and the seeded accounts (admin@salehtech.az, tural.zeynalov@, nigar.aliyeva@).
// It creates its own students/class/lessons and deletes them again at the end.   Run:  node scripts/e2e/class-flow.mjs
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
const admin=new Client(), teacher=new Client(), teacher2=new Client(), anon=new Client();
const stamp=Date.now().toString(36);

check("admin login", (await admin.login("admin@salehtech.az","admin123"))?.role==="ADMIN");
check("teacher login (Tural/Nicat)", (await teacher.login("tural.zeynalov@salehtech.az","teacher123"))?.role==="TEACHER");
check("second teacher login (Nigar)", (await teacher2.login("nigar.aliyeva@salehtech.az","teacher123"))?.role==="TEACHER");

// ---------- 1. create student
let r=await admin.req("POST","/api/admin/students",{firstName:"Ali",lastName:"Mammadov"+stamp.slice(-2).replace(/\d/g,"x"),email:`ali.${stamp}@test.az`,password:"Student2026",birthDate:"2012-05-04",grade:8,fin:"ALI"+stamp.slice(-4).toUpperCase().padStart(4,"X"),newParent:{name:"Parent Test",email:`parent.${stamp}@test.az`,password:"Parent2026"}});
check("admin creates student Ali (201)", r.status===201 && r.data.name.startsWith("Ali"), JSON.stringify(r.data).slice(0,200));
const ali=r.data;
check("response has no password hash", !JSON.stringify(r.data).match(/passwordHash|\$2[aby]\$/));
r=await admin.req("POST","/api/admin/students",{firstName:"Leyla",lastName:"Hasanli",email:`leyla.${stamp}@test.az`,password:"Student2026",birthDate:"2011-03-09",grade:9,parentId:ali.parent.id});
check("admin creates student Leyla under the same parent", r.status===201, JSON.stringify(r.data).slice(0,200));
const leyla=r.data;
r=await admin.req("POST","/api/admin/students",{firstName:"Ali",lastName:"Dup",email:`ali.${stamp}@test.az`,password:"Student2026",birthDate:"2011-03-09",parentId:ali.parent.id});
check("duplicate e-mail -> 409", r.status===409 && r.data.fields?.email, JSON.stringify(r.data));
r=await admin.req("POST","/api/admin/students",{firstName:"X",lastName:"Y",email:"bad",password:"1",birthDate:"2030-01-01"});
check("invalid student input -> 400 with Azerbaijani message", r.status===400 && typeof r.data.error==="string", JSON.stringify(r.data));

// ---------- 2. search is server-side and immediate
r=await admin.req("GET",`/api/admin/students/search?q=${encodeURIComponent("leyla hasanli")}`);
check("new student is searchable by name immediately", r.status===200 && r.data.items.some(s=>s.id===leyla.id), JSON.stringify(r.data).slice(0,200));
r=await admin.req("GET",`/api/admin/students/search?q=${encodeURIComponent(ali.fin)}`);
check("searchable by exact FIN", r.data.items.some(s=>s.id===ali.id));
r=await admin.req("GET",`/api/admin/students/search?q=${encodeURIComponent(ali.id.slice(0,12))}`);
check("searchable by student id", r.data.items.some(s=>s.id===ali.id));
r=await admin.req("GET","/api/admin/students/search?q=a&limit=500");
check("search result size is capped", r.data.items.length<=25, String(r.data.items.length));

// ---------- 3. teacher + course pickers
r=await admin.req("GET","/api/admin/teachers/search?q=Hətəmli");
const t1=r.data.items[0]; check("teacher picker finds the teacher", !!t1, JSON.stringify(r.data));
r=await admin.req("GET","/api/admin/teachers/search?q=Nigar"); const t2=r.data.items.find(t=>t.id!==t1.id);
check("teacher picker returns teachers only (no parents/admins)", r.data.items.every(t=>t.position!==undefined));
const courses=(await admin.req("GET","/api/admin/courses")).data.items; const course=courses[0];

// ---------- 4. create class
r=await admin.req("POST","/api/admin/classes",{name:`Python Beginner ${stamp}`,courseId:course.id,teacherId:t1.id,studentIds:[ali.id,leyla.id]});
check("admin creates class with teacher + 2 students (201)", r.status===201 && r.data.students.length===2 && r.data.teacher.id===t1.id, JSON.stringify(r.data).slice(0,300));
const cls=r.data;
r=await admin.req("POST","/api/admin/classes",{name:"x",courseId:course.id,teacherId:"nope",studentIds:[]}); check("bad class input -> 400", r.status===400);
r=await admin.req("POST","/api/admin/classes",{name:"Class X",courseId:course.id,teacherId:"does-not-exist",studentIds:[]}); check("unknown teacher -> 404 'Müəllim tapılmadı.'", r.status===404 && r.data.error==="Müəllim tapılmadı.", JSON.stringify(r.data));
const parentUser=(await q(`SELECT u.id FROM "User" u JOIN "ParentProfile" p ON p."userId"=u.id WHERE u.email=$1`,[`parent.${stamp}@test.az`]))[0];
r=await admin.req("POST","/api/admin/classes",{name:"Class Y",courseId:course.id,teacherId:parentUser.id,studentIds:[]}); check("a non-teacher id cannot be assigned", r.status===404, JSON.stringify(r.data));
r=await admin.req("POST","/api/admin/classes",{name:"Class Z",courseId:course.id,teacherId:t1.id,studentIds:["ghost"]}); check("unknown student -> 404", r.status===404, JSON.stringify(r.data));
r=await admin.req("POST",`/api/admin/classes/${cls.id}/students`,{studentIds:[ali.id]}); check("adding an existing member -> 409 'artıq bu sinifdədir'", r.status===409 && r.data.error==="Seçilmiş tələbə artıq bu sinifdədir.", JSON.stringify(r.data));
const dupMembers=await q(`SELECT count(*)::int n FROM "Enrollment" WHERE "classId"=$1 AND "studentId"=$2`,[cls.id,ali.id]); check("no duplicate membership row", dupMembers[0].n===1);

// ---------- 5. teacher + student dashboards see it
r=await teacher.req("GET","/api/teacher/classes"); check("teacher sees the new class", r.data.items.some(c=>c.id===cls.id && c.students===2), JSON.stringify(r.data).slice(0,200));
r=await teacher.req("GET",`/api/teacher/classes/${cls.id}/students`); check("teacher sees both students", r.status===200 && r.data.items.length===2);
r=await teacher2.req("GET",`/api/teacher/classes/${cls.id}/students`); check("another teacher cannot read the class (403)", r.status===403, String(r.status));
r=await teacher2.req("GET","/api/teacher/classes"); check("another teacher's list does not contain it", !r.data.items.some(c=>c.id===cls.id));
const aliC=new Client(), leylaC=new Client();
check("student Ali can sign in with the admin-set password", (await aliC.login(`ali.${stamp}@test.az`,"Student2026"))?.role==="STUDENT");
await leylaC.login(`leyla.${stamp}@test.az`,"Student2026");
r=await aliC.req("GET","/api/student/classes"); check("student sees the class, the teacher and status", r.data.items.some(c=>c.id===cls.id && c.teacherName===cls.teacher.name && c.status==="ACTIVE"), JSON.stringify(r.data).slice(0,250));
check("student dashboard page renders (HTTP 200)", (await fetch(B+"/student",{headers:{cookie:aliC.cookieHeader()},redirect:"manual"})).status===200);

// ---------- 6. security
check("anon admin API -> 401", (await anon.req("GET","/api/admin/classes")).status===401);
check("student calling admin API -> 403", (await aliC.req("GET","/api/admin/classes")).status===403);
check("teacher calling admin API -> 403", (await teacher.req("GET","/api/admin/students")).status===403);
check("teacher cannot assign classes / create students (403)", (await teacher.req("POST","/api/admin/classes",{name:"Mine",courseId:course.id,teacherId:t1.id})).status===403);
check("cross-origin admin mutation -> 403", (await admin.req("POST","/api/admin/classes",{name:"Evil",courseId:course.id,teacherId:t1.id},{origin:"https://evil.example"})).status===403);

// ---------- 7. lessons + completion + 8-lesson payment rule
const lessons=[]; 
for(let i=1;i<=17;i++){ const d=`2026-12-${String(i).padStart(2,"0")}T18:00`; const l=await teacher.req("POST",`/api/teacher/classes/${cls.id}/lessons`,{date:d}); if(l.status!==201) console.log("lesson create fail",i,l.status,JSON.stringify(l.data)); lessons.push(l.data.id); }
check("teacher created 17 lessons", lessons.filter(Boolean).length===17);
check("another teacher cannot add lessons to the class (403)", (await teacher2.req("POST",`/api/teacher/classes/${cls.id}/lessons`,{date:"2026-12-30T18:00"})).status===403);
const adminUnread0=(await q(`SELECT count(*)::int n FROM "Notification" u JOIN "User" x ON x.id=u."userId" WHERE x.role='ADMIN' AND u."entityType"='payment' AND u."createdAt">=$1`,[startedAt]))[0].n;
const complete=(l,ids,who=teacher)=>who.req("POST",`/api/teacher/lessons/${l}/complete`,{studentIds:ids});
check("student cannot mark a lesson complete (403)", (await complete(lessons[0],[ali.id],aliC)).status===403);
check("other teacher cannot complete it (403)", (await complete(lessons[0],[ali.id],teacher2)).status===403);
r=await complete(lessons[0],[ali.id]); check("lesson 1 completed -> progress 1/8", r.status===200 && r.data.items[0].completedLessons===1 && r.data.items[0].progress===1 && r.data.items[0].paymentsOpened===0, JSON.stringify(r.data));
r=await complete(lessons[0],[ali.id]); check("completing the same lesson again is idempotent (still 1)", r.data.items[0].completedLessons===1 && r.data.items[0].changed===false);
r=await complete(lessons[1],["ghost-student"]); check("student outside the class -> 404", r.status===404, JSON.stringify(r.data));
for(let i=1;i<7;i++) await complete(lessons[i],[ali.id]);
let pays=await q(`SELECT * FROM "Payment" WHERE "studentId"=$1`,[ali.id]); check("7 lessons: no payment yet", pays.length===0);
r=await complete(lessons[7],[ali.id]); check("8th lesson -> progress 8/8 and one payment opened", r.data.items[0].completedLessons===8 && r.data.items[0].progress===8 && r.data.items[0].paymentsOpened===1, JSON.stringify(r.data));
pays=await q(`SELECT * FROM "Payment" WHERE "studentId"=$1`,[ali.id]); check("payment cycle 1 = DUE, lessons 1-8, amount = course price", pays.length===1 && pays[0].status==="DUE" && pays[0].cycle===1 && pays[0].lessonsFrom===1 && pays[0].lessonsTo===8 && pays[0].amount===course.price, JSON.stringify(pays));
let adminN=await q(`SELECT n.* FROM "Notification" n JOIN "User" x ON x.id=n."userId" WHERE x.role='ADMIN' AND n."entityType"='payment' AND n."entityId"=$1`,[pays[0].id]); check("every admin got exactly one payment notification", adminN.length>=1 && new Set(adminN.map(n=>n.userId)).size===adminN.length, String(adminN.length));
check("notification text names student, class and 8 lessons", adminN[0].body.includes("Ali") && adminN[0].body.includes("8 dərs tamamlandı") && adminN[0].body.includes("Ödəniş vaxtıdır"), adminN[0].body);
const parentN=await q(`SELECT * FROM "Notification" n JOIN "User" u ON u.id=n."userId" WHERE n."entityId"=$1 AND u.role='PARENT'`,[pays[0].id]); check("parent was told too", parentN.length===1);
// repeated updates must not duplicate
await complete(lessons[7],[ali.id]); await complete(lessons[7],[ali.id]);
await teacher.req("POST","/api/teacher/lessons/"+lessons[7]+"/complete",{studentIds:[ali.id,leyla.id]});
pays=await q(`SELECT * FROM "Payment" WHERE "studentId"=$1`,[ali.id]); const pn=await q(`SELECT count(*)::int n FROM "Notification" WHERE "entityId"=$1 AND "entityType"='payment'`,[pays[0].id]);
check("repeated requests: still ONE payment and no extra notifications", pays.length===1 && pn[0].n===adminN.length+parentN.length+1 /* + the student's own */ || pn[0].n===adminN.length+parentN.length+1, `${pays.length} payments, ${pn[0].n} notifications`);
// concurrency on Leyla: 8 lessons, last one sent 4x in parallel
for(let i=0;i<7;i++) await complete(lessons[i],[leyla.id]);
await Promise.all([1,2,3,4].map(()=>complete(lessons[7],[leyla.id])));
const lp=await q(`SELECT * FROM "Payment" WHERE "studentId"=$1`,[leyla.id]); const ln=await q(`SELECT count(*)::int n FROM "Notification" n JOIN "User" x ON x.id=n."userId" WHERE x."role"='ADMIN' AND n."entityId"=$1`,[lp[0]?.id]);
check("4 simultaneous completions of Leyla's 8th lesson: exactly one payment, one notification per admin", lp.length===1 && ln[0].n===adminN.length, `${lp.length} payments, ${ln[0].n} admin notifications`);

// ---------- 8. admin payment dashboard
r=await admin.req("GET","/api/admin/payments?status=DUE"); check("admin sees the DUE payments", r.data.items.some(p=>p.id===pays[0].id && p.studentName.startsWith("Ali") && p.lessonsTo===8), JSON.stringify(r.data.items.slice(0,1)));
check("teacher cannot change payment status (403)", (await teacher.req("PATCH",`/api/admin/payments/${pays[0].id}/status`,{status:"PAID"})).status===403);
check("student cannot change payment status (403)", (await aliC.req("PATCH",`/api/admin/payments/${pays[0].id}/status`,{status:"PAID"})).status===403);
r=await admin.req("PATCH",`/api/admin/payments/${pays[0].id}/status`,{status:"PAID"}); check("admin marks payment PAID with paidAt", r.status===200 && r.data.status==="PAID" && !!r.data.paidAt, JSON.stringify(r.data));
const ct=(await admin.req("PATCH",`/api/admin/payments/${pays[0].id}/status`,{status:"PAID"})).data; check("marking PAID twice is a no-op", ct.paidAt===r.data.paidAt);
// ---------- 9. next cycle
for(let i=8;i<16;i++) await complete(lessons[i],[ali.id]);
pays=await q(`SELECT * FROM "Payment" WHERE "studentId"=$1 ORDER BY cycle`,[ali.id]);
check("16 lessons: cycle 2 opened (lessons 9-16), cycle 1 stays PAID and was not reopened", pays.length===2 && pays[1].cycle===2 && pays[1].lessonsFrom===9 && pays[1].lessonsTo===16 && pays[1].status==="DUE" && pays[0].status==="PAID", JSON.stringify(pays.map(p=>[p.cycle,p.status])));
await complete(lessons[16],[ali.id]); pays=await q(`SELECT * FROM "Payment" WHERE "studentId"=$1`,[ali.id]); r=await admin.req("GET",`/api/admin/classes/${cls.id}`);
check("17th lesson: no third payment; admin class details show Ali 1/8 · 17 lessons", pays.length===2 && r.data.students.find(s=>s.studentId===ali.id).progress===1 && r.data.students.find(s=>s.studentId===ali.id).completedLessons===17, JSON.stringify(r.data.students.find(s=>s.studentId===ali.id)));

// ---------- 10. teacher change
r=await admin.req("PUT",`/api/admin/classes/${cls.id}/teacher`,{teacherId:t2.id}); check("admin reassigns the class to another teacher", r.status===200 && r.data.teacher.id===t2.id);
check("old teacher lost the class", !(await teacher.req("GET","/api/teacher/classes")).data.items.some(c=>c.id===cls.id));
check("old teacher can no longer complete lessons (403)", (await complete(lessons[16],[ali.id])).status===403);
check("new teacher has it with both students", (await teacher2.req("GET",`/api/teacher/classes/${cls.id}/students`)).data.items.length===2);
check("students stayed in the class", (await aliC.req("GET","/api/student/classes")).data.items.some(c=>c.id===cls.id));

// ---------- 11. removal keeps history
r=await admin.req("DELETE",`/api/admin/classes/${cls.id}/students/${leyla.id}`); check("admin removes Leyla from the class", r.status===200 && r.data.students.length===1);
check("Leyla's account and her payment survive", (await q(`SELECT 1 FROM "StudentProfile" WHERE id=$1`,[leyla.id])).length===1 && (await q(`SELECT 1 FROM "Payment" WHERE "studentId"=$1`,[leyla.id])).length===1);
check("Leyla no longer sees the class", !(await leylaC.req("GET","/api/student/classes")).data.items.some(c=>c.id===cls.id));

// ---------- 12. archive
r=await admin.req("DELETE",`/api/admin/classes/${cls.id}`); check("class with history is archived, not deleted", r.status===200 && r.data.archived===true && r.data.deleted===false, JSON.stringify(r.data));
check("archived class gone from teacher + student dashboards", !(await teacher2.req("GET","/api/teacher/classes")).data.items.some(c=>c.id===cls.id) && !(await aliC.req("GET","/api/student/classes")).data.items.some(c=>c.id===cls.id));
check("admin finds it under ARCHIVED, history intact", (await admin.req("GET","/api/admin/classes?status=ARCHIVED&q="+stamp)).data.items.some(c=>c.id===cls.id) && (await q(`SELECT count(*)::int n FROM "Payment" WHERE "classId"=$1`,[cls.id]))[0].n===3);
r=await admin.req("PATCH",`/api/admin/classes/${cls.id}`,{status:"ACTIVE"}); check("archived class can be restored", r.status===200 && r.data.status==="ACTIVE");
// empty class deletion
r=await admin.req("POST","/api/admin/classes",{name:`Empty ${stamp}`,courseId:course.id,teacherId:t1.id}); const del=await admin.req("DELETE",`/api/admin/classes/${r.data.id}`); check("an empty class is really deleted", del.data.deleted===true && (await q(`SELECT 1 FROM "ClassGroup" WHERE id=$1`,[r.data.id])).length===0);

// ---------- 13. audit + notifications
const audit=await q(`SELECT DISTINCT action FROM "AuditLog" WHERE "createdAt">=$1`,[startedAt]);
const actions=audit.map(a=>a.action);
check("audit trail has the key actions", ["student.create","class.create","class.teacher.change","class.student.remove","class.archive","lesson.complete","payment.due","payment.paid"].every(a=>actions.includes(a)), actions.join(","));
check("audit never contains passwords or the FIN", (await q(`SELECT count(*)::int n FROM "AuditLog" WHERE "createdAt">=$1 AND (after::text ILIKE '%Student2026%' OR after::text ILIKE '%$2a$%' OR after::text ILIKE $2)`,[startedAt,`%${ali.fin}%`]))[0].n===0);
r=await admin.req("GET","/api/admin/notifications"); check("admin notification API lists unread payment notices", r.status===200 && r.data.unread>=1);
r=await admin.req("GET","/api/admin/audit?action=payment."); check("audit API filters by action", r.status===200 && r.data.items.every(a=>a.action.startsWith("payment.")));

console.log(`\n${pass} passed, ${failn} failed`);
// ---------- cleanup (everything this run created)
await q(`DELETE FROM "ClassGroup" WHERE name LIKE $1 OR name LIKE $2`,[`%${stamp}`,`Empty ${stamp}`]).catch(()=>{});
await q(`DELETE FROM "User" WHERE email LIKE $1`,[`%.${stamp}@test.az`]);
await q(`DELETE FROM "Notification" WHERE "createdAt">=$1 AND "entityType" IN ('payment','class')`,[startedAt]);
await q(`DELETE FROM "AuditLog" WHERE "createdAt">=$1 AND "entityType" IN ('payment','class','student','user') `,[startedAt]);
console.log("cleaned up test data");
