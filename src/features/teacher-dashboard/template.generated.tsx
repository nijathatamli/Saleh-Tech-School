/* eslint-disable */
// GENERATED FILE — do not edit. Source: src/features/teacher-dashboard/template.html
// Regenerate with: node scripts/dc-template-to-tsx.mjs
import { Fragment } from "react";
import { sx } from "./sx";
import type { TemplateVals } from "./vals";

export function renderTemplate(v: TemplateVals) {
  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }} className="td-root">
      <div style={{ position: "fixed", top: "-340px", right: "-220px", width: "1000px", height: "820px", background: "radial-gradient(closest-side,rgba(255,107,0,0.13),rgba(255,107,0,0) 78%)", filter: "blur(30px)", animation: "glow-drift 26s ease-in-out infinite", pointerEvents: "none", zIndex: "0" }}></div>
      <div style={{ position: "fixed", bottom: "-360px", left: "-200px", width: "820px", height: "720px", background: "radial-gradient(closest-side,rgba(255,107,0,0.075),rgba(255,107,0,0) 76%)", filter: "blur(34px)", pointerEvents: "none", zIndex: "0" }}></div>
      <div className="td-desktop">
        <div style={{ position: "relative", zIndex: "1" }}>
          <nav style={{ position: "fixed", top: "22px", left: "22px", bottom: "22px", width: "236px", zIndex: "20", display: "flex", flexDirection: "column", padding: "22px 14px", borderRadius: "30px", background: "rgba(255,255,255,0.62)", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset,0 22px 50px -30px rgba(23,23,23,0.28)" }}>
            <div style={{ padding: "6px 12px 26px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/logo-s.png" alt="" width="42" height="38" style={{ width: "42px", height: "38px", flexShrink: "0", userSelect: "none" }} />
              <span style={{ display: "flex", flexDirection: "column", fontFamily: "var(--font-unbounded),sans-serif", fontSize: "20px", fontWeight: "400", lineHeight: "0.95", letterSpacing: "-0.02em", color: "#1A1A1A" }}>
                <span>Tech</span>
                <span>School</span>
              </span>
            </div>
            <div style={{ flex: "1", minHeight: "0", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
              {v.navItems.map((n, i0) => (
                <Fragment key={i0}>
                  <button onClick={n.onGo} style={sx(n.style)}>
                    <i style={{ fontSize: "14px", width: "18px", textAlign: "center", opacity: "0.9" }} className={n.icon}></i>
                    {" "}
                    <span style={{ flex: "1", textAlign: "left" }}>{n.label}</span>
                    {" "}
                    <span style={sx(n.badgeStyle)}>{n.badge}</span>
                  </button>
                </Fragment>
              ))}
            </div>
            <div style={{ flexShrink: "0", marginTop: "16px", padding: "16px 14px", borderRadius: "20px", background: "rgba(255,107,0,0.07)", border: "1px solid rgba(255,107,0,0.14)" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F6B" }}>Bu həftə</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.03em", marginTop: "10px" }}>
                {v.weekLessonsLabel}
              </div>
              <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "6px" }}>
                {v.weekSummary}
              </div>
            </div>
            <div style={{ flexShrink: "0", paddingTop: "18px", marginTop: "16px", borderTop: "1px solid rgba(23,23,23,0.06)", display: "flex", alignItems: "center", gap: "11px", paddingLeft: "8px" }}>
              <span style={sx(v.teacherAvatar0)}>
                {v.teacherInitials}
              </span>
              <div style={{ minWidth: "0" }}>
                <div style={{ fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v.teacherName}
                </div>
                <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "1px" }}>Müəllim</div>
              </div>
              <button onClick={v.onLogout} title="Çıxış" aria-label="Çıxış" style={{ marginLeft: "auto", width: "32px", height: "32px", borderRadius: "10px", border: "1px solid transparent", background: "transparent", color: "#6F6F6B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: "0", transition: "background 0.18s ease,color 0.18s ease" }} className="td-h1">
                <i style={{ fontSize: "13px" }} className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>
          </nav>
          <main style={{ marginLeft: "280px", padding: "46px 46px 80px 24px", maxWidth: "1240px" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "32px", marginBottom: "44px", animation: "rise 0.5s ease both" }}>
              <div>
                {v.inDetail ? (
                  <>
                    <button onClick={v.goBack} style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "18px", padding: "9px 16px 9px 13px", borderRadius: "12px", border: "1px solid rgba(23,23,23,0.08)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(18px)", fontSize: "12.5px", fontWeight: "600", color: "#171717", cursor: "pointer", transition: "background 0.18s ease,transform 0.18s ease" }} className="td-h2">
                      <i style={{ fontSize: "11px" }} className="fa-solid fa-arrow-left"></i>
                      {v.backLabel}
                    </button>
                  </>
                ) : null}
                <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "40px", fontWeight: "600", letterSpacing: "-0.032em", lineHeight: "1.12", margin: "0" }}>
                  {v.pageTitle}
                </h1>
                <p style={{ fontSize: "16.5px", color: "#6F6F6B", margin: "12px 0 0 0", letterSpacing: "-0.005em" }}>
                  {v.pageSub}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: "0" }}>
                <button style={{ width: "40px", height: "40px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.055)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px) saturate(170%)", WebkitBackdropFilter: "blur(18px) saturate(170%)", color: "#4A4A46", cursor: "pointer", position: "relative", transition: "background 0.18s ease" }} className="td-h3">
                  <i style={{ fontSize: "14px" }} className="fa-regular fa-bell"></i>
                  {" "}
                  <span style={sx(v.unreadDotStyle)}></span>
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "6px 8px 6px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px) saturate(170%)", WebkitBackdropFilter: "blur(18px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 10px 26px -18px rgba(23,23,23,0.3)" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "500", color: "#6F6F6B", whiteSpace: "nowrap" }}>
                    {v.today}
                  </span>
                  <span style={sx(v.teacherAvatar1)}>
                    {v.teacherInitials}
                  </span>
                </div>
              </div>
            </header>
            {v.atClassDetail ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "20px" }}>
                    {v.detailStats.map((s, i1) => (
                      <Fragment key={i1}>
                        <div style={{ padding: "22px 24px", borderRadius: "22px", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(23,23,23,0.045)" }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>{s.label}</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "27px", fontWeight: "600", letterSpacing: "-0.03em", marginTop: "12px" }}>{s.value}</div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button onClick={v.openAttendance} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "15px 28px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} className="td-h4 td-a5">
                      <i style={{ fontSize: "12px" }} className="fa-solid fa-calendar-check"></i>
                      Davamiyyəti qeyd et
                    </button>
                    <button onClick={v.openNewHw} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "15px 26px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease,transform 0.18s ease" }} className="td-h6 td-a5">
                      <i style={{ fontSize: "11px" }} className="fa-solid fa-plus"></i>
                      Tapşırıq təyin et
                    </button>
                  </div>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    <div style={{ padding: "24px 30px", borderBottom: "1px solid rgba(23,23,23,0.055)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0" }}>Tələbələr</h2>
                      <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#6F6F6B" }}>
                        {v.detailRoster.length}{" nəfər"}
                      </span>
                    </div>
                    {v.detailRoster.map((s, i2) => (
                      <Fragment key={i2}>
                        <div onClick={s.onOpen} style={sx(s.rowStyle)} className="td-h7">
                          <span style={sx(s.avatarDetail)}>{s.initials}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.008em" }}>{s.name}</div>
                            <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "4px" }}>{s.hw}{" tapşırıq"}</div>
                          </div>
                          <span style={sx(s.attStyle)}>{s.att}</span>
                          {" "}
                          <span style={{ width: "80px", textAlign: "right", fontSize: "14px", fontWeight: "600", fontVariantNumeric: "tabular-nums", flexShrink: "0" }}>{s.grade}</span>
                          {" "}
                          <i style={{ fontSize: "11px", color: "#6F6F6B", flexShrink: "0" }} className="fa-solid fa-chevron-right"></i>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
            {v.atStudentDetail ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "860px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "20px" }}>
                    {v.detailStats.map((s, i3) => (
                      <Fragment key={i3}>
                        <div style={{ padding: "24px 26px", borderRadius: "22px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(23,23,23,0.045)" }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>{s.label}</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "28px", fontWeight: "600", letterSpacing: "-0.032em", marginTop: "12px" }}>{s.value}</div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "26px" }}>Fənlər üzrə inkişaf</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                      {v.studentSkills.map((s, i4) => (
                        <Fragment key={i4}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "9px" }}>
                              <span style={{ fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.005em" }}>{s.name}</span>
                              <span style={{ fontSize: "14px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{s.pctLabel}</span>
                            </div>
                            <div style={{ height: "6px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                              <div style={sx(s.barStyle)}></div>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                      {v.noSkills ? (
                        <>
                          <div style={{ fontSize: "14px", color: "#6F6F6B" }}>Hələ bacarıq qeydi yoxdur.</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px" }}>Müəllim qeydi</div>
                    <textarea name="teacherNote" placeholder="Bu tələbə barədə qeyd yazın…" style={{ width: "100%", minHeight: "104px", padding: "16px 18px", borderRadius: "16px", border: "1px solid rgba(23,23,23,0.1)", background: "#FCFCFA", fontSize: "14px", lineHeight: "1.6", color: "#171717", outline: "none", resize: "vertical", transition: "border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease" }} className="td-f8"></textarea>
                    <div style={{ display: "flex", gap: "12px", marginTop: "18px", flexWrap: "wrap" }}>
                      <button style={{ padding: "14px 26px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} onClick={v.onSendNote} className="td-h4 td-a5">Qeydi göndər</button>
                      <button style={{ padding: "14px 24px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} onClick={v.onWriteParent} className="td-h7">Valideynə yaz</button>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {v.atAttendance ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "860px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", padding: "22px 26px", borderRadius: "22px", background: "rgba(255,255,255,0.62)", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset,0 20px 44px -30px rgba(23,23,23,0.3)" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Qeyd olundu</div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.03em", marginTop: "10px" }}>
                        {v.markedLabel}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button onClick={v.markAllPresent} style={{ padding: "13px 22px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.18s ease" }} className="td-h7">Hamısı iştirak etdi</button>
                      <button onClick={v.saveAttendance} style={{ padding: "13px 26px", borderRadius: "14px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} className="td-h4 td-a5">
                        {v.saveLabel}
                      </button>
                    </div>
                  </div>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    {v.attendanceRoster.map((s, i5) => (
                      <Fragment key={i5}>
                        <div style={sx(s.rowStyle)}>
                          <span style={sx(s.avatarAttendance)}>{s.initials}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.008em" }}>{s.name}</div>
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexShrink: "0" }}>
                            {s.options.map((o, i6) => (
                              <Fragment key={i6}>
                                <button onClick={o.onPick} style={sx(o.style)}>{o.label}</button>
                              </Fragment>
                            ))}
                          </div>
                          {v.noAttendanceLesson ? (
                            <>
                              <div style={{ padding: "24px 26px", borderRadius: "24px", background: "rgba(255,255,255,0.5)", border: "1px dashed rgba(23,23,23,0.13)", fontSize: "14px", color: "#6F6F6B" }}>
                                Bu sinif üçün dərs tapılmadı — əvvəlcə təqvimdən dərs əlavə edin.
                              </div>
                            </>
                          ) : null}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
            {v.atGrading ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "860px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
                      <div style={{ minWidth: "0" }}>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Tapşırıq</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.025em", marginTop: "12px" }}>
                          {v.gradeTitle}
                        </div>
                        <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "8px" }}>
                          {v.gradeMeta}
                        </div>
                      </div>
                      <span style={{ padding: "7px 14px", borderRadius: "10px", background: "rgba(255,107,0,0.1)", color: "#E66000", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap", flexShrink: "0" }}>
                        {v.gradedLabel}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                    {v.gradeRoster.map((g, i7) => (
                      <Fragment key={i7}>
                        <div style={{ padding: "22px 24px", borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <span style={sx(g.avatar)}>{g.initials}</span>
                            <div style={{ flex: "1", minWidth: "0" }}>
                              <div style={{ fontSize: "14.5px", fontWeight: "600", letterSpacing: "-0.008em" }}>{g.name}</div>
                              <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "4px" }}>{g.submitted}</div>
                            </div>
                            <span style={sx(g.fileStyle)}>
                              <i style={{ fontSize: "10px" }} className="fa-solid fa-paperclip"></i>
                              {g.file}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: "5px" }}>
                              {g.scores.map((s, i8) => (
                                <Fragment key={i8}>
                                  <button onClick={s.onPick} style={sx(s.style)}>{s.label}</button>
                                </Fragment>
                              ))}
                            </div>
                            {v.noGradeRoster ? (
                              <>
                                <div style={{ padding: "24px 26px", borderRadius: "24px", background: "rgba(255,255,255,0.5)", border: "1px dashed rgba(23,23,23,0.13)", fontSize: "14px", color: "#6F6F6B" }}>Bu tapşırıq üzrə təhvil yoxdur.</div>
                              </>
                            ) : null}
                            <input type="text" name={g.inputName} defaultValue={g.feedback} placeholder="Qısa rəy" style={{ flex: "1", minWidth: "160px", padding: "12px 16px", borderRadius: "13px", border: "1px solid rgba(23,23,23,0.1)", background: "#FCFCFA", fontSize: "13.5px", color: "#171717", outline: "none", transition: "border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease" }} className="td-f8" />
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <button onClick={v.onSaveGrades} style={{ width: "fit-content", padding: "15px 30px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} className="td-h4 td-a5">
                    {v.saveGradesLabel}
                  </button>
                </section>
              </>
            ) : null}
            {v.atNewHw ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "720px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", flexDirection: "column", gap: "22px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "9px" }}>Başlıq</label>
                      {" "}
                      <input type="text" name="hwTitle" placeholder="məs. Şəbəkə təhlükəsizliyi laboratoriyası" style={{ width: "100%", padding: "15px 17px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.1)", background: "#FCFCFA", fontSize: "14px", color: "#171717", outline: "none", transition: "border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease" }} className="td-f8" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "9px" }}>Təsvir</label>
                      <textarea name="hwDescription" placeholder="Tapşırığın şərtlərini yazın…" style={{ width: "100%", minHeight: "118px", padding: "15px 17px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.1)", background: "#FCFCFA", fontSize: "14px", lineHeight: "1.6", color: "#171717", outline: "none", resize: "vertical", transition: "border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease" }} className="td-f8"></textarea>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "11px" }}>Sinif</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {v.newHwClasses.map((c, i9) => (
                          <Fragment key={i9}>
                            <button onClick={c.onPick} style={sx(c.style)}>{c.label}</button>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "18px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "9px" }}>Son tarix</label>
                        {" "}
                        <input type="date" name="hwDueDate" defaultValue={v.hwDefaultDue} style={{ width: "100%", padding: "15px 17px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.1)", background: "#FCFCFA", fontSize: "14px", color: "#171717", outline: "none", transition: "border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease" }} className="td-f8" />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "9px" }}>Maksimal bal</label>
                        {" "}
                        <input type="text" name="hwMaxScore" defaultValue="100" style={{ width: "100%", padding: "15px 17px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.1)", background: "#FCFCFA", fontSize: "14px", color: "#171717", outline: "none", transition: "border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease" }} className="td-f8" />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button onClick={v.onCreateHw} style={{ padding: "15px 30px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} className="td-h4 td-a5">Tapşırığı təyin et</button>
                    <button onClick={v.goBack} style={{ padding: "15px 26px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} className="td-h7">Ləğv et</button>
                  </div>
                </section>
              </>
            ) : null}
            {v.atHome ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px", paddingLeft: "2px" }}>Bugün</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: "20px" }}>
                    <div style={{ position: "relative", overflow: "hidden", padding: "34px 36px", borderRadius: "28px", background: "linear-gradient(140deg,#1C1B19,#2A2825)", color: "#fff", boxShadow: "0 30px 66px -34px rgba(23,23,23,0.6)" }}>
                      <div style={{ position: "absolute", top: "-110px", right: "-90px", width: "320px", height: "320px", background: "radial-gradient(closest-side,rgba(255,107,0,0.42),rgba(255,107,0,0) 74%)", pointerEvents: "none" }}></div>
                      <div style={{ position: "relative", zIndex: "1" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "22px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00", animation: "pulse-ring 2.6s ease-out infinite" }}></span>
                          <span style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.62)" }}>Növbəti dərs</span>
                        </div>
                        {v.hasNextLesson ? (
                          <>
                            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "27px", fontWeight: "600", letterSpacing: "-0.028em", lineHeight: "1.24", margin: "0" }}>
                              {v.nextLessonTitle}
                            </h2>
                            <div style={{ fontSize: "14.5px", fontWeight: "600", margin: "20px 0 0 0" }}>
                              {v.nextLessonWhen}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "20px", margin: "24px 0 0 0", paddingTop: "22px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                              <div>
                                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "21px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                                  {v.nextLessonClass}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.55)", marginTop: "4px" }}>Sinif</div>
                              </div>
                              <span style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.12)" }}></span>
                              <div>
                                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "21px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                                  {v.nextLessonCount}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.55)", marginTop: "4px" }}>Tələbə</div>
                              </div>
                            </div>
                            <button onClick={v.openAttendance} style={{ width: "100%", marginTop: "26px", padding: "16px", borderRadius: "16px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 14px 30px -12px rgba(255,107,0,0.7)", transition: "transform 0.18s ease" }} className="td-h4 td-a5">Davamiyyəti qeyd et →</button>
                          </>
                        ) : null}
                        {v.noNextLesson ? (
                          <>
                            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.025em", lineHeight: "1.3", margin: "0" }}>Planlaşdırılmış dərs yoxdur.</h2>
                            <div style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.55)", marginTop: "12px" }}>Siniflərim bölməsindən təqvimə dərs əlavə edin.</div>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ padding: "34px 36px", borderRadius: "28px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "22px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                        <span style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6F6F6B" }}>Qiymətləndirmə gözləyir</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "44px", fontWeight: "600", letterSpacing: "-0.035em", lineHeight: "1" }}>
                          {v.pendingTotal}
                        </span>
                        <span style={{ fontSize: "15px", color: "#6F6F6B", fontWeight: "500" }}>təhvil</span>
                      </div>
                      <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "12px" }}>
                        {v.queueMeta}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px", borderRadius: "16px", overflow: "hidden", background: "rgba(23,23,23,0.055)", marginTop: "26px" }}>
                        {v.gradingQueue.map((g, i10) => (
                          <Fragment key={i10}>
                            <div onClick={g.onOpen} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "#fff", cursor: "pointer", transition: "background 0.18s ease" }} className="td-h7">
                              <span style={{ flex: "1", fontSize: "13.5px", fontWeight: "500", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</span>
                              <span style={sx(g.chipStyle)}>{g.count}</span>
                              <i style={{ fontSize: "10px", color: "#6F6F6B", flexShrink: "0" }} className="fa-solid fa-chevron-right"></i>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      {v.noQueue ? (
                        <>
                          <div style={{ fontSize: "14px", color: "#6F6F6B", marginTop: "18px" }}>Gözləyən təhvil yoxdur.</div>
                        </>
                      ) : null}
                      <button onClick={v.openGrading} style={{ width: "100%", padding: "15px", borderRadius: "16px", border: "none", background: "#171717", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", marginTop: "26px", transition: "transform 0.18s ease,opacity 0.18s ease" }} className="td-h9 td-a5">Qiymətləndirməyə başla →</button>
                    </div>
                  </div>
                </section>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "20px", marginBottom: "20px", animation: "rise 0.5s ease both", animationDelay: "100ms" }}>
                  {v.stats.map((s, i11) => (
                    <Fragment key={i11}>
                      <div style={{ padding: "22px 24px", borderRadius: "22px", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(23,23,23,0.045)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>{s.label}</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "27px", fontWeight: "600", letterSpacing: "-0.03em", marginTop: "12px" }}>{s.value}</div>
                      </div>
                    </Fragment>
                  ))}
                </section>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "160ms", marginBottom: "20px" }}>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    <div style={{ padding: "24px 30px", borderBottom: "1px solid rgba(23,23,23,0.055)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0" }}>Bugünkü cədvəl</h2>
                      <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#6F6F6B" }}>
                        {v.scheduleCountLabel}
                      </span>
                    </div>
                    {v.schedule.map((s, i12) => (
                      <Fragment key={i12}>
                        <div onClick={s.onOpen} style={sx(s.rowStyle)} className="td-h7">
                          <span style={sx(s.timeStyle)}>{s.time}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.008em" }}>{s.title}</div>
                            <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>{s.meta}</div>
                          </div>
                          <span style={sx(s.chipStyle)}>{s.status}</span>
                          {" "}
                          <i style={{ fontSize: "11px", color: "#6F6F6B", flexShrink: "0" }} className="fa-solid fa-chevron-right"></i>
                        </div>
                      </Fragment>
                    ))}
                    {v.noSchedule ? (
                      <>
                        <div style={{ padding: "24px 30px", fontSize: "14px", color: "#6F6F6B" }}>Bu gün dərs yoxdur.</div>
                      </>
                    ) : null}
                  </div>
                </section>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: "20px", animation: "rise 0.5s ease both", animationDelay: "220ms" }}>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ marginBottom: "26px" }}>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0" }}>Sinif davamiyyəti</h2>
                      <p style={{ fontSize: "13.5px", color: "#6F6F6B", margin: "8px 0 0 0" }}>Bu ay · sinif üzrə</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                      {v.classRates.map((c, i13) => (
                        <Fragment key={i13}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "9px" }}>
                              <span style={{ fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.005em" }}>{c.name}</span>
                              <span style={{ fontSize: "14px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{c.pctLabel}</span>
                            </div>
                            <div style={{ height: "6px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                              <div style={sx(c.barStyle)}></div>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                      {v.noClasses ? (
                        <>
                          <div style={{ fontSize: "14px", color: "#6F6F6B" }}>Hələ sinif yoxdur.</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px", paddingLeft: "2px" }}>Diqqət tələb edir</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                      {v.atRisk.map((r, i14) => (
                        <Fragment key={i14}>
                          <div onClick={r.onOpen} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", cursor: "pointer", transition: "transform 0.18s ease,box-shadow 0.18s ease" }} className="td-h10">
                            <span style={sx(r.avatar)}>{r.initials}</span>
                            <div style={{ flex: "1", minWidth: "0" }}>
                              <div style={{ fontSize: "14px", fontWeight: "600" }}>{r.name}</div>
                              <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "4px" }}>{r.reason}</div>
                            </div>
                            <span style={sx(r.chipStyle)}>{r.metric}</span>
                          </div>
                        </Fragment>
                      ))}
                      {v.noRisk ? (
                        <>
                          <div style={{ fontSize: "14px", color: "#6F6F6B" }}>Hamı qaydasındadır.</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {v.atClasses ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", marginBottom: "20px" }}>
                  <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "22px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <button onClick={v.prevMonth} style={{ width: "34px", height: "34px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", color: "#6F6F6B", cursor: "pointer", transition: "background 0.18s ease" }} className="td-h7">
                          <i style={{ fontSize: "11px" }} className="fa-solid fa-chevron-left"></i>
                        </button>
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "19px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0", minWidth: "140px", textAlign: "center" }}>
                          {v.monthLabel}
                        </h2>
                        <button onClick={v.nextMonth} style={{ width: "34px", height: "34px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", color: "#6F6F6B", cursor: "pointer", transition: "background 0.18s ease" }} className="td-h7">
                          <i style={{ fontSize: "11px" }} className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11.5px", color: "#6F6F6B" }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "#FF6B00" }}></span>
                          Dərs var
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11.5px", color: "#6F6F6B" }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "rgba(23,23,23,0.22)" }}></span>
                          Tapşırıq son tarixi
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "8px", marginBottom: "12px" }}>
                      {v.weekDays.map((w, i15) => (
                        <Fragment key={i15}>
                          <div style={{ textAlign: "center", fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase", color: "#6F6F6B" }}>{w}</div>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "8px" }}>
                      {v.calendar.map((d, i16) => (
                        <Fragment key={i16}>
                          <button onClick={d.onPick} style={sx(d.style)}>
                            <span>{d.label}</span>
                            {" "}
                            <span style={sx(d.dotStyle)}></span>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "90ms", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", paddingLeft: "2px", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>
                        {v.dayHeading}
                      </div>
                      <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#6F6F6B" }}>
                        {v.daySummary}
                      </span>
                    </div>
                    {v.notAdding ? (
                      <>
                        <button onClick={v.startAdd} style={{ display: "flex", alignItems: "center", gap: "9px", padding: "12px 22px", borderRadius: "13px", border: "1px solid rgba(255,107,0,0.3)", background: "rgba(255,107,0,0.07)", color: "#E66000", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.18s ease,transform 0.18s ease" }} className="td-h11 td-a5">
                          <i style={{ fontSize: "10px" }} className="fa-solid fa-plus"></i>
                          Dərs əlavə et
                        </button>
                      </>
                    ) : null}
                  </div>
                  {v.isAdding ? (
                    <>
                      <div style={{ padding: "28px 30px", borderRadius: "26px", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)", border: "1px solid rgba(255,107,0,0.22)", boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset,0 20px 44px -30px rgba(23,23,23,0.3)", marginBottom: "14px", animation: "rise-sm 0.3s ease both" }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.022em", marginBottom: "22px" }}>
                          {v.addLabel}
                        </div>
                        <div style={{ marginBottom: "22px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "11px" }}>Sinif</label>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {v.draftClasses.map((c, i17) => (
                              <Fragment key={i17}>
                                <button onClick={c.onPick} style={sx(c.style)}>{c.label}</button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: "26px" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "11px" }}>Saat</label>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {v.draftTimes.map((t, i18) => (
                              <Fragment key={i18}>
                                <button onClick={t.onPick} style={sx(t.style)}>{t.label}</button>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <button onClick={v.confirmAdd} style={{ padding: "14px 28px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} className="td-h4 td-a5">Dərsi əlavə et</button>
                          <button onClick={v.cancelAdd} style={{ padding: "14px 24px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} className="td-h7">Ləğv et</button>
                        </div>
                      </div>
                    </>
                  ) : null}
                  {v.dayHasLessons ? (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {v.dayLessons.map((l, i19) => (
                          <Fragment key={i19}>
                            <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                              <div style={{ padding: "24px 30px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", borderBottom: "1px solid rgba(23,23,23,0.055)" }}>
                                <span style={sx(l.timeStyle)}>{l.time}</span>
                                <div style={{ flex: "1", minWidth: "160px" }}>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.022em" }}>{l.className}</div>
                                  <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "6px" }}>{l.meta}</div>
                                </div>
                                <button onClick={l.onAttendance} style={{ padding: "12px 22px", borderRadius: "13px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 10px 22px -10px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} className="td-h4 td-a5">Davamiyyəti qeyd et</button>
                                <button onClick={l.onOpen} style={{ padding: "12px 20px", borderRadius: "13px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.18s ease" }} className="td-h7">Sinifə bax</button>
                                <button onClick={l.onRemove} title="Dərsi sil" style={{ width: "40px", height: "40px", borderRadius: "13px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", color: "#6F6F6B", cursor: "pointer", flexShrink: "0", transition: "background 0.18s ease,color 0.18s ease" }} className="td-h12">
                                  <i style={{ fontSize: "12px" }} className="fa-regular fa-trash-can"></i>
                                </button>
                              </div>
                              {l.roster.map((s, i20) => (
                                <Fragment key={i20}>
                                  <div onClick={s.onOpen} style={sx(s.rowStyle)} className="td-h7">
                                    <span style={sx(s.avatarDay)}>{s.initials}</span>
                                    <div style={{ flex: "1", minWidth: "0" }}>
                                      <div style={{ fontSize: "14px", fontWeight: "500", letterSpacing: "-0.008em" }}>{s.name}</div>
                                      <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "4px" }}>{s.hw}{" tapşırıq"}</div>
                                    </div>
                                    <span style={sx(s.attStyle)}>{s.att}</span>
                                    {" "}
                                    <span style={{ width: "70px", textAlign: "right", fontSize: "13.5px", fontWeight: "600", fontVariantNumeric: "tabular-nums", flexShrink: "0" }}>{s.grade}</span>
                                    {" "}
                                    <i style={{ fontSize: "11px", color: "#6F6F6B", flexShrink: "0" }} className="fa-solid fa-chevron-right"></i>
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {v.dayEmpty ? (
                    <>
                      <div style={{ padding: "56px 24px", textAlign: "center", borderRadius: "26px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(23,23,23,0.045)" }}>
                        <span style={{ width: "46px", height: "46px", borderRadius: "15px", background: "#F2F2EF", color: "#6F6F6B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px auto" }}>
                          <i style={{ fontSize: "15px" }} className="fa-regular fa-calendar"></i>
                        </span>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.02em" }}>Bu gün dərs yoxdur.</div>
                        <div style={{ fontSize: "14px", color: "#6F6F6B", marginTop: "8px" }}>Təqvimdən başqa gün seçin.</div>
                      </div>
                    </>
                  ) : null}
                </section>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "140ms", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "20px" }}>
                  {v.classes.map((c, i21) => (
                    <Fragment key={i21}>
                      <div style={{ padding: "30px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", transition: "transform 0.2s ease,box-shadow 0.2s ease" }} className="td-h13">
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                          <div style={{ minWidth: "0" }}>
                            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.022em" }}>{c.name}</div>
                            <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "6px" }}>{c.course}</div>
                          </div>
                          <span style={sx(c.tagStyle)}>{c.code}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", margin: "26px 0 24px 0" }}>
                          {c.stats.map((s, i22) => (
                            <Fragment key={i22}>
                              <div>
                                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.025em" }}>{s.v}</div>
                                <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "4px" }}>{s.k}</div>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                        <div style={{ height: "6px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden", marginBottom: "24px" }}>
                          <div style={sx(c.barStyle)}></div>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={c.onOpen} style={{ flex: "1", padding: "13px", borderRadius: "14px", border: "none", background: "#171717", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "transform 0.18s ease,opacity 0.18s ease" }} className="td-h14 td-a5">Sinifə bax</button>
                          <button onClick={c.onAttendance} style={{ padding: "13px 18px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.18s ease" }} className="td-h7">Davamiyyət</button>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                  {v.noClasses ? (
                    <>
                      <div style={{ padding: "46px 24px", textAlign: "center", borderRadius: "26px", background: "rgba(255,255,255,0.5)", border: "1px dashed rgba(23,23,23,0.13)", fontSize: "14px", color: "#6F6F6B" }}>Sizə təyin edilmiş sinif yoxdur.</div>
                    </>
                  ) : null}
                </section>
              </>
            ) : null}
            {v.atHomework ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "22px" }}>
                    <div style={{ display: "flex", gap: "3px", padding: "4px", borderRadius: "14px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px)", border: "1px solid rgba(23,23,23,0.055)", width: "fit-content" }}>
                      {v.hwTabs.map((t, i23) => (
                        <Fragment key={i23}>
                          <button onClick={t.onGo} style={sx(t.style)}>{t.label}</button>
                        </Fragment>
                      ))}
                    </div>
                    <button onClick={v.openNewHw} style={{ padding: "14px 26px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} className="td-h4 td-a5">Yeni tapşırıq</button>
                  </div>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    {v.hwList.map((h, i24) => (
                      <Fragment key={i24}>
                        <div onClick={h.onOpen} style={sx(h.rowStyle)} className="td-h7">
                          <span style={sx(h.iconStyle)}>
                            <i style={{ fontSize: "13px" }} className={h.icon}></i>
                          </span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "15px", fontWeight: "500", letterSpacing: "-0.008em" }}>{h.title}</div>
                            <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>{h.meta}</div>
                          </div>
                          <span style={sx(h.chipStyle)}>{h.status}</span>
                          {" "}
                          <span style={{ fontSize: "12.5px", color: "#6F6F6B", width: "104px", textAlign: "right", flexShrink: "0" }}>{h.due}</span>
                          {" "}
                          <i style={{ fontSize: "11px", color: "#6F6F6B", flexShrink: "0" }} className="fa-solid fa-chevron-right"></i>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  {v.hwEmpty ? (
                    <>
                      <div style={{ padding: "56px 24px", textAlign: "center", borderRadius: "26px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(23,23,23,0.045)", marginTop: "20px" }}>
                        <span style={{ width: "46px", height: "46px", borderRadius: "15px", background: "#F2F2EF", color: "#6F6F6B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px auto" }}>
                          <i style={{ fontSize: "15px" }} className="fa-solid fa-check"></i>
                        </span>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.02em" }}>Bu filtrdə tapşırıq yoxdur.</div>
                      </div>
                    </>
                  ) : null}
                </section>
              </>
            ) : null}
            {v.atStudents ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms" }}>
                  <div style={{ display: "flex", gap: "3px", padding: "4px", borderRadius: "14px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px)", border: "1px solid rgba(23,23,23,0.055)", width: "fit-content", marginBottom: "22px" }}>
                    {v.classTabs.map((t, i25) => (
                      <Fragment key={i25}>
                        <button onClick={t.onGo} style={sx(t.style)}>{t.label}</button>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    <div style={{ padding: "18px 26px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(23,23,23,0.055)", fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>
                      <span style={{ width: "40px", flexShrink: "0" }}></span>
                      <span style={{ flex: "1" }}>Tələbə</span>
                      <span style={{ width: "100px", textAlign: "right" }}>Davamiyyət</span>
                      <span style={{ width: "100px", textAlign: "right" }}>Orta bal</span>
                      <span style={{ width: "96px", textAlign: "right" }}>Tapşırıq</span>
                    </div>
                    {v.students.map((s, i26) => (
                      <Fragment key={i26}>
                        <div onClick={s.onOpen} style={sx(s.rowStyle)} className="td-h7">
                          <span style={sx(s.avatarList)}>{s.initials}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.008em" }}>{s.name}</div>
                            <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "4px" }}>{s.meta}</div>
                          </div>
                          <span style={sx(s.attStyle)}>{s.att}</span>
                          {" "}
                          <span style={{ width: "100px", textAlign: "right", fontSize: "14px", fontWeight: "600", fontVariantNumeric: "tabular-nums", flexShrink: "0" }}>{s.grade}</span>
                          {" "}
                          <span style={{ width: "96px", textAlign: "right", fontSize: "13px", color: "#6F6F6B", flexShrink: "0" }}>{s.hw}</span>
                        </div>
                      </Fragment>
                    ))}
                    {v.noStudents ? (
                      <>
                        <div style={{ padding: "24px 26px", fontSize: "14px", color: "#6F6F6B" }}>Bu filtrdə tələbə yoxdur.</div>
                      </>
                    ) : null}
                  </div>
                </section>
              </>
            ) : null}
            {v.atProfile ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "760px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ padding: "34px 36px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
                    <span style={sx(v.teacherAvatar2)}>
                      {v.teacherInitials}
                    </span>
                    <div style={{ flex: "1", minWidth: "180px" }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                        {v.teacherName}
                      </div>
                      <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "7px" }}>
                        {v.teacherPosition}
                      </div>
                    </div>
                    <button style={{ padding: "12px 20px", borderRadius: "13px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", transition: "background 0.18s ease" }} onClick={v.onChangeAvatar} className="td-h7">Şəkli dəyiş</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "20px" }}>
                    {v.profileStats.map((p, i27) => (
                      <Fragment key={i27}>
                        <div style={{ padding: "24px 26px", borderRadius: "22px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(23,23,23,0.045)" }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>{p.k}</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "28px", fontWeight: "600", letterSpacing: "-0.032em", marginTop: "12px" }}>{p.v}</div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "24px" }}>Şəxsi məlumat</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "18px" }}>
                      {v.fields.map((f, i28) => (
                        <Fragment key={i28}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "9px" }}>{f.label}</label>
                            {" "}
                            <input type="text" name={f.name} defaultValue={f.value} readOnly={f.readOnly} style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.1)", background: "#FCFCFA", fontSize: "14px", color: "#171717", outline: "none", transition: "border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease" }} className="td-f8" />
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "8px" }}>Bildirişlər</div>
                    {v.toggles.map((t, i29) => (
                      <Fragment key={i29}>
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "18px 0", borderBottom: "1px solid rgba(23,23,23,0.05)" }}>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: "500" }}>{t.label}</div>
                            <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>{t.desc}</div>
                          </div>
                          <button onClick={t.onToggle} style={sx(t.trackStyle)}>
                            <span style={sx(t.knobStyle)}></span>
                          </button>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{ padding: "15px 30px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} onClick={v.onSaveProfile} className="td-h4 td-a5">Yadda saxla</button>
                    <button onClick={v.onCancelProfile} style={{ padding: "15px 26px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} className="td-h7">Ləğv et</button>
                  </div>
                </section>
              </>
            ) : null}
          </main>
        </div>
      </div>
      <div className="td-mobile">
        <div style={{ position: "relative", zIndex: "1" }}>
          <div style={{ width: "100%", height: "100dvh", background: "#F7F7F5", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: "-180px", right: "-120px", width: "460px", height: "400px", background: "radial-gradient(closest-side,rgba(255,107,0,0.16),rgba(255,107,0,0) 76%)", filter: "blur(16px)", pointerEvents: "none" }}></div>
            <div style={{ flex: "1", overflowY: "auto", padding: "24px 22px 130px 22px", position: "relative", zIndex: "1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "26px" }}>
                <div>
                  <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "25px", fontWeight: "600", letterSpacing: "-0.03em", lineHeight: "1.18", margin: "0" }}>
                    {v.mTitle}
                  </h1>
                  <p style={{ fontSize: "14px", color: "#6F6F6B", margin: "8px 0 0 0" }}>
                    {v.mSub}
                  </p>
                </div>
                <span style={sx(v.teacherAvatar3)}>
                  {v.teacherInitials}
                </span>
              </div>
              {v.mAtHome ? (
                <>
                  <div style={{ position: "relative", overflow: "hidden", padding: "26px 24px", borderRadius: "28px", background: "linear-gradient(140deg,#1C1B19,#2A2825)", color: "#fff", marginBottom: "12px" }}>
                    <div style={{ position: "absolute", top: "-90px", right: "-70px", width: "260px", height: "260px", background: "radial-gradient(closest-side,rgba(255,107,0,0.42),rgba(255,107,0,0) 74%)", pointerEvents: "none" }}></div>
                    <div style={{ position: "relative", zIndex: "1" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                        <span style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Növbəti dərs</span>
                      </div>
                      {v.hasNextLesson ? (
                        <>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "19px", fontWeight: "600", letterSpacing: "-0.025em", lineHeight: "1.3" }}>
                            {v.nextLessonTitle}
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "12px" }}>
                            {v.nextLessonWhen}
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
                            {v.nextLessonMeta}
                          </div>
                          <button onClick={v.openAttendance} style={{ width: "100%", marginTop: "20px", padding: "14px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 10px 22px -10px rgba(255,107,0,0.7)" }}>Davamiyyəti qeyd et →</button>
                        </>
                      ) : null}
                      {v.noNextLesson ? (
                        <>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.025em", lineHeight: "1.3" }}>Planlaşdırılmış dərs yoxdur.</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>Siniflər bölməsindən təqvimə dərs əlavə edin.</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ padding: "24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                      <span style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6F6F6B" }}>Qiymətləndirmə gözləyir</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "32px", fontWeight: "600", letterSpacing: "-0.035em", lineHeight: "1" }}>
                        {v.pendingTotal}
                      </span>
                      <span style={{ fontSize: "13px", color: "#6F6F6B" }}>{"təhvil · "}{v.gradingQueue.length}{" tapşırıq"}</span>
                    </div>
                    <button style={{ width: "100%", marginTop: "18px", padding: "14px", borderRadius: "15px", border: "none", background: "#171717", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }} onClick={v.openGrading}>Qiymətləndir →</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "26px" }}>
                    {v.stats.map((s, i30) => (
                      <Fragment key={i30}>
                        <div style={{ padding: "20px 18px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F6B" }}>{s.label}</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.032em", marginTop: "10px" }}>{s.value}</div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "16px" }}>Bugünkü cədvəl</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "26px" }}>
                    {v.schedule.map((s, i31) => (
                      <Fragment key={i31}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(s.timeStyle)}>{s.time}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500" }}>{s.title}</div>
                            <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "4px" }}>{s.meta}</div>
                          </div>
                          <span style={sx(s.chipStyle)}>{s.status}</span>
                        </div>
                      </Fragment>
                    ))}
                    {v.noSchedule ? (
                      <>
                        <div style={{ padding: "16px 18px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", fontSize: "13px", color: "#6F6F6B" }}>Bu gün dərs yoxdur.</div>
                      </>
                    ) : null}
                  </div>
                  <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "16px" }}>Diqqət tələb edir</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {v.atRisk.map((r, i32) => (
                      <Fragment key={i32}>
                        <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "16px 18px", borderRadius: "20px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(r.avatarMobile)}>{r.initials}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "13.5px", fontWeight: "600" }}>{r.name}</div>
                            <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "4px" }}>{r.reason}</div>
                          </div>
                          <span style={sx(r.chipStyle)}>{r.metric}</span>
                        </div>
                      </Fragment>
                    ))}
                    {v.noRisk ? (
                      <>
                        <div style={{ padding: "16px 18px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", fontSize: "13px", color: "#6F6F6B" }}>Hamı qaydasındadır.</div>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
              {v.mAtClasses ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both", padding: "22px 20px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                      <button onClick={v.prevMonth} style={{ width: "32px", height: "32px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", color: "#6F6F6B", cursor: "pointer", flexShrink: "0" }}>
                        <i style={{ fontSize: "10px" }} className="fa-solid fa-chevron-left"></i>
                      </button>
                      <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "15px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                        {v.monthLabel}
                      </span>
                      <button onClick={v.nextMonth} style={{ width: "32px", height: "32px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", color: "#6F6F6B", cursor: "pointer", flexShrink: "0" }}>
                        <i style={{ fontSize: "10px" }} className="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px", marginBottom: "10px" }}>
                      {v.weekDays.map((w, i33) => (
                        <Fragment key={i33}>
                          <div style={{ textAlign: "center", fontSize: "9px", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", color: "#6F6F6B" }}>{w}</div>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px" }}>
                      {v.calendarMobile.map((d, i34) => (
                        <Fragment key={i34}>
                          <button onClick={d.onPick} style={sx(d.style)}>
                            <span>{d.label}</span>
                            {" "}
                            <span style={sx(d.dotStyle)}></span>
                          </button>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>
                      {v.dayHeading}
                    </div>
                    <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#6F6F6B", whiteSpace: "nowrap" }}>
                      {v.daySummary}
                    </span>
                  </div>
                  {v.notAdding ? (
                    <>
                      <button onClick={v.startAdd} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", width: "100%", padding: "14px", borderRadius: "15px", border: "1px solid rgba(255,107,0,0.3)", background: "rgba(255,107,0,0.07)", color: "#E66000", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "14px" }}>
                        <i style={{ fontSize: "10px" }} className="fa-solid fa-plus"></i>
                        Dərs əlavə et
                      </button>
                    </>
                  ) : null}
                  {v.isAdding ? (
                    <>
                      <div style={{ padding: "22px 20px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(255,107,0,0.22)", marginBottom: "14px", animation: "rise-sm 0.3s ease both" }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "15px", fontWeight: "600", letterSpacing: "-0.022em", marginBottom: "18px" }}>
                          {v.addLabel}
                        </div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#6F6F6B", marginBottom: "10px" }}>Sinif</label>
                        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
                          {v.draftClassCodes.map((c, i35) => (
                            <Fragment key={i35}>
                              <button onClick={c.onPick} style={sx(c.style)}>{c.label}</button>
                            </Fragment>
                          ))}
                        </div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#6F6F6B", marginBottom: "10px" }}>Saat</label>
                        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "22px" }}>
                          {v.draftTimes.map((t, i36) => (
                            <Fragment key={i36}>
                              <button onClick={t.onPick} style={sx(t.style)}>{t.label}</button>
                            </Fragment>
                          ))}
                        </div>
                        <button onClick={v.confirmAdd} style={{ width: "100%", padding: "14px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 10px 22px -10px rgba(255,107,0,0.6)" }}>Dərsi əlavə et</button>
                        {" "}
                        <button onClick={v.cancelAdd} style={{ width: "100%", marginTop: "10px", padding: "13px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Ləğv et</button>
                      </div>
                    </>
                  ) : null}
                  {v.dayHasLessons ? (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "26px" }}>
                        {v.dayLessons.map((l, i37) => (
                          <Fragment key={i37}>
                            <div style={{ borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", overflow: "hidden" }}>
                              <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(23,23,23,0.055)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <span style={sx(l.timeStyle)}>{l.time}</span>
                                  <div style={{ flex: "1", minWidth: "0" }}>
                                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "15px", fontWeight: "600", letterSpacing: "-0.022em" }}>{l.className}</div>
                                    <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "5px" }}>{l.meta}</div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                                  <button onClick={l.onAttendance} style={{ flex: "1", padding: "13px", borderRadius: "14px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", boxShadow: "0 10px 22px -10px rgba(255,107,0,0.6)" }}>Davamiyyəti qeyd et</button>
                                  <button onClick={l.onRemove} style={{ width: "46px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", color: "#6F6F6B", cursor: "pointer", flexShrink: "0" }}>
                                    <i style={{ fontSize: "12px" }} className="fa-regular fa-trash-can"></i>
                                  </button>
                                </div>
                              </div>
                              {l.roster.map((s, i38) => (
                                <Fragment key={i38}>
                                  <div style={sx(s.mobileRowStyle)}>
                                    <span style={sx(s.avatarDayMobile)}>{s.initials}</span>
                                    <div style={{ flex: "1", minWidth: "0" }}>
                                      <div style={{ fontSize: "13.5px", fontWeight: "500" }}>{s.name}</div>
                                      <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "4px" }}>{s.hw}{" tapşırıq"}</div>
                                    </div>
                                    <span style={sx(s.attStyle)}>{s.att}</span>
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {v.dayEmpty ? (
                    <>
                      <div style={{ padding: "40px 20px", textAlign: "center", borderRadius: "24px", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(23,23,23,0.045)", marginBottom: "26px" }}>
                        <span style={{ width: "42px", height: "42px", borderRadius: "14px", background: "#F2F2EF", color: "#6F6F6B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                          <i style={{ fontSize: "14px" }} className="fa-regular fa-calendar"></i>
                        </span>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>Bu gün dərs yoxdur.</div>
                        <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "7px" }}>Təqvimdən başqa gün seçin.</div>
                      </div>
                    </>
                  ) : null}
                  <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "16px" }}>Bütün siniflər</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                    {v.classes.map((c, i39) => (
                      <Fragment key={i39}>
                        <div style={{ padding: "22px 20px", borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                            <div style={{ minWidth: "0" }}>
                              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.022em" }}>{c.name}</div>
                              <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "5px" }}>{c.course}</div>
                            </div>
                            <span style={sx(c.tagStyle)}>{c.code}</span>
                          </div>
                          <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden", marginTop: "18px" }}>
                            <div style={sx(c.barStyle)}></div>
                          </div>
                          <div style={{ display: "flex", gap: "16px", marginTop: "14px" }}>
                            {c.stats.map((s, i40) => (
                              <Fragment key={i40}>
                                <div>
                                  <span style={{ fontSize: "14px", fontWeight: "600" }}>{s.v}</span>
                                  <span style={{ fontSize: "11.5px", color: "#6F6F6B", marginLeft: "5px" }}>{s.k}</span>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {v.mAtHomework ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both", display: "flex", flexDirection: "column", gap: "11px" }}>
                    {v.hwList.map((h, i41) => (
                      <Fragment key={i41}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(h.iconStyle)}>
                            <i style={{ fontSize: "12px" }} className={h.icon}></i>
                          </span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", letterSpacing: "-0.008em" }}>{h.title}</div>
                            <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "5px" }}>{h.meta}{" · "}{h.due}</div>
                          </div>
                          <span style={sx(h.chipStyle)}>{h.status}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {v.mAtStudents ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both", display: "flex", flexDirection: "column", gap: "11px" }}>
                    {v.students.map((s, i42) => (
                      <Fragment key={i42}>
                        <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "16px 18px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(s.avatarListMobile)}>{s.initials}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "13.5px", fontWeight: "600" }}>{s.name}</div>
                            <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "4px" }}>{s.meta}{" · "}{s.hw}</div>
                          </div>
                          <span style={sx(s.attStyle)}>{s.att}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {v.mAtProfile ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both" }}>
                    <div style={{ padding: "26px 24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                      <span style={sx(v.teacherAvatar4)}>
                        {v.teacherInitials}
                      </span>
                      <div style={{ minWidth: "0" }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.022em" }}>
                          {v.teacherName}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>
                          {v.teacherPosition}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "26px" }}>
                      {v.profileStats.map((p, i43) => (
                        <Fragment key={i43}>
                          <div style={{ padding: "20px 18px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                            <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F6B" }}>{p.k}</div>
                            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.032em", marginTop: "10px" }}>{p.v}</div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ padding: "8px 22px 14px 22px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                      {v.toggles.map((t, i44) => (
                        <Fragment key={i44}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 0", borderBottom: "1px solid rgba(23,23,23,0.05)" }}>
                            <div style={{ flex: "1", minWidth: "0" }}>
                              <div style={{ fontSize: "14px", fontWeight: "500" }}>{t.label}</div>
                              <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "5px" }}>{t.desc}</div>
                            </div>
                            <button onClick={t.onToggle} style={sx(t.trackStyle)}>
                              <span style={sx(t.knobStyle)}></span>
                            </button>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <button onClick={v.onLogout} style={{ width: "100%", marginTop: "14px", padding: "15px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} className="td-h7">Çıxış</button>
                  </div>
                </>
              ) : null}
            </div>
            <div style={{ position: "absolute", bottom: "22px", left: "20px", right: "20px", zIndex: "5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2px", padding: "9px", borderRadius: "26px", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(26px) saturate(180%)", WebkitBackdropFilter: "blur(26px) saturate(180%)", border: "1px solid rgba(23,23,23,0.06)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset,0 20px 44px -22px rgba(23,23,23,0.4)" }}>
              {v.mobileNav.map((m, i45) => (
                <Fragment key={i45}>
                  <button onClick={m.onGo} style={sx(m.style)}>
                    <i style={{ fontSize: "16px" }} className={m.icon}></i>
                    {" "}
                    <span style={sx(m.labelStyle)}>{m.label}</span>
                    {" "}
                    <span style={sx(m.dotStyle)}></span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
