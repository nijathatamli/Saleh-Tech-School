/* eslint-disable */
// GENERATED FILE — do not edit. Source: src/features/parent-dashboard/template.html
// Regenerate with: node scripts/dc-template-to-tsx.mjs
import { Fragment } from "react";
import { sx } from "./sx";
import type { TemplateVals } from "./vals";

export function renderTemplate(v: TemplateVals) {
  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }} className="pp-root">
      <div style={{ position: "fixed", top: "-340px", right: "-220px", width: "1000px", height: "820px", background: "radial-gradient(closest-side,rgba(255,107,0,0.13),rgba(255,107,0,0) 78%)", filter: "blur(30px)", animation: "glow-drift 26s ease-in-out infinite", pointerEvents: "none", zIndex: "0" }}></div>
      <div style={{ position: "fixed", bottom: "-360px", left: "-200px", width: "820px", height: "720px", background: "radial-gradient(closest-side,rgba(255,107,0,0.075),rgba(255,107,0,0) 76%)", filter: "blur(34px)", pointerEvents: "none", zIndex: "0" }}></div>
      <div className="pp-desktop">
        <div style={{ position: "relative", zIndex: "1" }}>
          <nav style={{ position: "fixed", top: "22px", left: "22px", bottom: "22px", width: "236px", zIndex: "20", display: "flex", flexDirection: "column", padding: "22px 14px", borderRadius: "30px", background: "rgba(255,255,255,0.62)", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset,0 22px 50px -30px rgba(23,23,23,0.28)" }}>
            <div style={{ padding: "6px 12px 26px 12px", display: "flex", alignItems: "center", gap: "11px" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "10px", background: "#171717", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>S</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "14.5px", fontWeight: "600", letterSpacing: "-0.01em" }}>
                Saleh
                <span style={{ color: "#FF6B00" }}>.</span>
                Tech
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
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
            <div style={{ marginTop: "auto", paddingTop: "18px", borderTop: "1px solid rgba(23,23,23,0.06)", display: "flex", alignItems: "center", gap: "11px", paddingLeft: "8px" }}>
              <span style={sx(v.parentAvatar0)}>
                {v.parentInitials}
              </span>
              <div style={{ minWidth: "0" }}>
                <div style={{ fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v.parentName}
                </div>
                <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "1px" }}>Valideyn</div>
              </div>
              <button onClick={v.onLogout} title="Çıxış" aria-label="Çıxış" style={{ marginLeft: "auto", width: "32px", height: "32px", borderRadius: "10px", border: "1px solid transparent", background: "transparent", color: "#6F6F6B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: "0", transition: "background 0.18s ease,color 0.18s ease" }} className="pp-h1">
                <i style={{ fontSize: "13px" }} className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>
          </nav>
          <main style={{ marginLeft: "280px", padding: "46px 46px 80px 24px", maxWidth: "1240px" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "32px", marginBottom: "52px", animation: "rise 0.5s ease both" }}>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "40px", fontWeight: "600", letterSpacing: "-0.032em", lineHeight: "1.12", margin: "0" }}>
                  {v.pageTitle}
                </h1>
                <p style={{ fontSize: "16.5px", color: "#6F6F6B", margin: "12px 0 0 0", letterSpacing: "-0.005em" }}>
                  {v.pageSub}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px 7px 16px", borderRadius: "999px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px) saturate(170%)", WebkitBackdropFilter: "blur(18px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 10px 26px -18px rgba(23,23,23,0.3)", flexShrink: "0" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "500", color: "#6F6F6B", whiteSpace: "nowrap" }}>
                  {v.today}
                </span>
                <span style={sx(v.parentAvatar1)}>
                  {v.parentInitials}
                </span>
              </div>
            </header>
            {v.atHome ? (
              <>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "20px", marginBottom: "20px", animation: "rise 0.5s ease both", animationDelay: "40ms" }}>
                  <div style={{ gridColumn: "span 1", padding: "30px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                      <span style={sx(v.childAvatar)}>
                        {v.childInitials}
                      </span>
                      <div style={{ minWidth: "0", flex: "1" }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "20px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                          {v.childName}
                        </div>
                        <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "4px" }}>
                          {v.childMeta}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "26px 0 24px 0" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 12px", borderRadius: "9px", background: "rgba(255,107,0,0.09)", fontSize: "12px", fontWeight: "600", color: "#171717" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                        {v.childLevel}
                      </span>
                      <span style={{ padding: "6px 12px", borderRadius: "9px", background: "#F2F2EF", fontSize: "12px", fontWeight: "500", color: "#4A4A46" }}>
                        {v.childYear}
                      </span>
                    </div>
                    <button style={{ width: "100%", padding: "13px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.08)", background: "#fff", fontSize: "13px", fontWeight: "600", color: "#171717", cursor: "pointer", transition: "background 0.18s ease,transform 0.18s ease" }} onClick={v.onSwitchChild} className="pp-h2 pp-a3">Övladı dəyişdir</button>
                  </div>
                  <div style={{ gridColumn: "span 1", padding: "30px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", alignItems: "center", gap: "30px" }}>
                    <div style={{ position: "relative", width: "132px", height: "132px", flexShrink: "0" }}>
                      <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#EFEEEA" strokeWidth="9"></circle>
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#FF6B00" strokeWidth="9" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset={v.attendanceOffset} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}></circle>
                      </svg>
                      <div style={{ position: "absolute", inset: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "31px", fontWeight: "600", letterSpacing: "-0.03em", lineHeight: "1" }}>
                          {v.attendancePct}
                          <span style={{ fontSize: "17px", color: "#6F6F6B" }}>%</span>
                        </span>
                      </div>
                    </div>
                    <div style={{ minWidth: "0" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Davamiyyət</div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em", margin: "9px 0 20px 0" }}>
                        {v.attendanceStanding}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                        {v.attendanceRows.map((a, i1) => (
                          <Fragment key={i1}>
                            <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px" }}>
                              <span style={sx(a.dotStyle)}></span>
                              <span style={{ color: "#6F6F6B", flex: "1" }}>{a.label}</span>
                              <span style={{ fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{a.value}</span>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "20px", marginBottom: "20px", animation: "rise 0.5s ease both", animationDelay: "100ms" }}>
                  {v.minorStats.map((m, i2) => (
                    <Fragment key={i2}>
                      <div style={{ padding: "22px 24px", borderRadius: "22px", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(23,23,23,0.045)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>{m.label}</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "27px", fontWeight: "600", letterSpacing: "-0.03em", marginTop: "12px" }}>{m.value}</div>
                      </div>
                    </Fragment>
                  ))}
                </section>
                <section style={{ padding: "34px 36px", borderRadius: "28px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", marginBottom: "20px", animation: "rise 0.5s ease both", animationDelay: "160ms" }}>
                  <div style={{ marginBottom: "34px" }}>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "23px", fontWeight: "600", letterSpacing: "-0.025em", margin: "0" }}>Öyrənmə inkişafı</h2>
                    <p style={{ fontSize: "14.5px", color: "#6F6F6B", margin: "9px 0 0 0" }}>
                      {v.progressSub}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                    {v.subjects.map((s, i3) => (
                      <Fragment key={i3}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "9px" }}>
                            <span style={{ fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.005em" }}>{s.name}</span>
                            <span style={{ fontSize: "14px", fontWeight: "600", fontVariantNumeric: "tabular-nums", color: "#171717" }}>{s.pctLabel}</span>
                          </div>
                          <div style={{ height: "6px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                            <div style={sx(s.barStyle)}></div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </section>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "20px", marginBottom: "20px", animation: "rise 0.5s ease both", animationDelay: "220ms" }}>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "26px" }}>
                      <div>
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0" }}>
                          {v.chartTitle}
                        </h2>
                        <p style={{ fontSize: "13.5px", color: "#6F6F6B", margin: "7px 0 0 0" }}>
                          {v.chartRange}
                        </p>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 11px", borderRadius: "8px", background: "rgba(255,107,0,0.09)", fontSize: "12px", fontWeight: "600" }}>
                        <i style={{ fontSize: "10px", color: "#E66000" }} className="fa-solid fa-arrow-trend-up"></i>
                        {v.chartDelta}
                      </span>
                    </div>
                    {v.hasTrend ? (
                      <>
                        <svg viewBox="0 0 420 150" preserveAspectRatio="none" style={{ width: "100%", height: "150px", display: "block", overflow: "visible" }}>
                          <defs>
                            <linearGradient id="pp-area" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.16"></stop>
                              <stop offset="100%" stopColor="#FF6B00" stopOpacity="0"></stop>
                            </linearGradient>
                          </defs>
                          <path d={v.chartArea} fill="url(#pp-area)"></path>
                          <path d={v.chartLine} fill="none" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                          {v.chartDots.map((d, i4) => (
                            <Fragment key={i4}>
                              <circle cx={d.x} cy={d.y} r={d.r} fill="#fff" stroke="#FF6B00" strokeWidth={d.sw}></circle>
                            </Fragment>
                          ))}
                        </svg>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                          {v.chartLabels.map((l, i5) => (
                            <Fragment key={i5}>
                              <span style={{ fontSize: "11.5px", color: "#6F6F6B", fontWeight: "500" }}>{l}</span>
                            </Fragment>
                          ))}
                        </div>
                      </>
                    ) : null}
                    {v.noTrend ? (
                      <>
                        <p style={{ fontSize: "13.5px", color: "#6F6F6B", margin: "0" }}>
                          Hələ kifayət qədər qiymət yoxdur. Qiymətlər daxil edildikcə inkişaf qrafiki burada görünəcək.
                        </p>
                      </>
                    ) : null}
                  </div>
                  <div style={{ padding: "30px 32px", borderRadius: "26px", background: "rgba(255,255,255,0.62)", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset,0 22px 48px -32px rgba(23,23,23,0.3)", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "24px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                      <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Növbəti dərs</span>
                    </div>
                    {v.hasNextLesson ? (
                      <>
                        <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.025em", margin: "0", lineHeight: "1.28" }}>
                          {v.lessonTitle}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "18px 0 26px 0", fontSize: "14px", color: "#171717" }}>
                          <span style={{ fontWeight: "600" }}>
                            {v.lessonWhen}
                          </span>
                          <span style={{ width: "1px", height: "14px", background: "rgba(23,23,23,0.14)" }}></span>
                          <span style={{ color: "#6F6F6B" }}>
                            {v.lessonDuration}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "22px", borderTop: "1px solid rgba(23,23,23,0.07)" }}>
                          <span style={sx(v.lessonTeacherAvatar)}>
                            {v.lessonTeacherInitials}
                          </span>
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: "600" }}>
                              {v.lessonTeacher}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "2px" }}>
                              {v.lessonTeacherRole}
                            </div>
                          </div>
                        </div>
                        <button style={{ width: "100%", padding: "15px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease,box-shadow 0.18s ease", marginTop: "28px" }} onClick={v.onGoLesson} className="pp-h4 pp-a3">Dərsə keç</button>
                      </>
                    ) : null}
                    {v.noNextLesson ? (
                      <>
                        <div style={{ padding: "22px 6px 6px 6px" }}>
                          <div style={{ fontSize: "15px", fontWeight: "600", letterSpacing: "-0.01em" }}>Planlaşdırılmış dərs yoxdur.</div>
                          <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "5px" }}>Növbəti dərs təyin ediləndə burada görünəcək.</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "20px", marginBottom: "20px", animation: "rise 0.5s ease both", animationDelay: "280ms" }}>
                  <div style={{ padding: "34px 36px", borderRadius: "26px", background: "#F2F2EF", border: "1px solid rgba(23,23,23,0.04)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "22px" }}>Müəllim qeydi</div>
                    {v.hasNote ? (
                      <>
                        <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "19px", fontWeight: "400", lineHeight: "1.55", letterSpacing: "-0.015em", margin: "0 0 26px 0", textWrap: "pretty" }}>"{v.noteText}"</p>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={sx(v.noteTeacherAvatar)}>
                            {v.noteTeacherInitials}
                          </span>
                          <div style={{ flex: "1" }}>
                            <div style={{ fontSize: "13px", fontWeight: "600" }}>
                              {v.noteTeacher}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "2px" }}>
                              {v.noteTeacherRole}
                            </div>
                          </div>
                          <span style={{ fontSize: "12px", color: "#6F6F6B" }}>
                            {v.noteDate}
                          </span>
                        </div>
                      </>
                    ) : null}
                    {v.noNote ? (
                      <>
                        <p style={{ fontSize: "14px", color: "#6F6F6B", margin: "0" }}>
                          Hələ müəllim qeydi yoxdur. Müəllim rəy bildirəndə burada görünəcək.
                        </p>
                      </>
                    ) : null}
                  </div>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0" }}>Ev tapşırığı</h2>
                      <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#6F6F6B" }}>
                        {v.homeworkActiveLabel}
                      </span>
                    </div>
                    {v.hasHomework ? (
                      <>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {v.homework.map((h, i6) => (
                            <Fragment key={i6}>
                              <div style={sx(h.rowStyle)}>
                                <span style={sx(h.dotStyle)}></span>
                                {" "}
                                <span style={{ flex: "1", fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.005em" }}>{h.title}</span>
                                {" "}
                                <span style={sx(h.metaStyle)}>{h.meta}</span>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </>
                    ) : null}
                    {v.noHomework ? (
                      <>
                        <div style={{ padding: "34px 0 30px 0", textAlign: "center" }}>
                          <span style={{ width: "42px", height: "42px", borderRadius: "14px", background: "#F2F2EF", color: "#6F6F6B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px auto" }}>
                            <i style={{ fontSize: "14px" }} className="fa-solid fa-check"></i>
                          </span>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em" }}>Hər şey tamamlanıb.</div>
                          <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "7px" }}>Hazırda gözləyən tapşırıq yoxdur.</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "20px", animation: "rise 0.5s ease both", animationDelay: "340ms" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "20px", paddingLeft: "2px" }}>Nailiyyətlər</div>
                    {v.hasAchievements ? (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                          {v.achievements.map((a, i7) => (
                            <Fragment key={i7}>
                              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px", borderRadius: "20px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", transition: "transform 0.18s ease,box-shadow 0.18s ease" }} className="pp-h5">
                                <span style={sx(a.medalStyle)}>
                                  <i style={{ fontSize: "14px" }} className={a.icon}>{a.iconText}</i>
                                </span>
                                <div style={{ flex: "1", minWidth: "0" }}>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "12.5px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase" }}>{a.name}</div>
                                  <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "4px" }}>{a.date}</div>
                                </div>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </>
                    ) : null}
                    {v.noAchievements ? (
                      <>
                        <div style={{ padding: "30px 24px", borderRadius: "20px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(23,23,23,0.045)", textAlign: "center" }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>İlk nailiyyət gözləyir.</div>
                          <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "7px" }}>Öyrənməyə davam et.</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "20px", paddingLeft: "2px" }}>Son fəaliyyət</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "2px" }}>
                      {v.activity.map((v, i8) => (
                        <Fragment key={i8}>
                          <div style={{ display: "flex", gap: "16px", padding: "14px 0" }}>
                            <span style={{ fontSize: "12px", color: "#6F6F6B", width: "78px", flexShrink: "0", paddingTop: "1px" }}>
                              {v.when}
                            </span>
                            <span style={sx(v.dotStyle)}></span>
                            <span style={{ fontSize: "14px", fontWeight: "450", letterSpacing: "-0.005em" }}>
                              {v.what}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {v.atChildren ? (
              <>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: "20px", animation: "rise 0.5s ease both", animationDelay: "40ms" }}>
                  {v.children.map((c, i9) => (
                    <Fragment key={i9}>
                      <div style={sx(c.cardStyle)}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "0" }}>
                            <span style={sx(c.avatarCard)}>{c.initials}</span>
                            <div style={{ minWidth: "0" }}>
                              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "19px", fontWeight: "600", letterSpacing: "-0.02em" }}>{c.name}</div>
                              <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "4px" }}>{c.meta}</div>
                            </div>
                          </div>
                          <span style={sx(c.tagStyle)}>{c.tag}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", margin: "26px 0 24px 0" }}>
                          {c.stats.map((s, i10) => (
                            <Fragment key={i10}>
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
                          <button style={{ flex: "1", padding: "13px", borderRadius: "14px", border: "none", background: "#171717", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "transform 0.18s ease,opacity 0.18s ease" }} onClick={c.onDetail} className="pp-h6 pp-a3">Ətraflı</button>
                          <button style={{ padding: "13px 18px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} onClick={c.onReport} className="pp-h7">Hesabat</button>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                  <div style={{ padding: "30px", borderRadius: "26px", border: "1px dashed rgba(23,23,23,0.14)", background: "rgba(255,255,255,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "240px", cursor: "pointer", transition: "background 0.2s ease,border-color 0.2s ease" }} className="pp-h8">
                    <span style={{ width: "44px", height: "44px", borderRadius: "15px", background: "#F2F2EF", color: "#4A4A46", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                      <i style={{ fontSize: "14px" }} className="fa-solid fa-plus"></i>
                    </span>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>Övlad əlavə et</div>
                    <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "7px", maxWidth: "190px" }}>Məktəbə müraciət edərək yeni tələbə əlavə edin.</div>
                  </div>
                </section>
              </>
            ) : null}
            {v.atAttendance ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "22px" }}>
                    <div style={{ display: "flex", gap: "3px", padding: "4px", borderRadius: "14px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px)", border: "1px solid rgba(23,23,23,0.055)" }}>
                      {v.monthTabs.map((m, i11) => (
                        <Fragment key={i11}>
                          <button onClick={m.onGo} style={sx(m.style)}>{m.label}</button>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
                      {v.attLegend.map((l, i12) => (
                        <Fragment key={i12}>
                          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#6F6F6B" }}>
                            <span style={sx(l.dotStyle)}></span>
                            {l.label}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px" }}>
                    <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "8px", marginBottom: "14px" }}>
                        {v.weekDays.map((w, i13) => (
                          <Fragment key={i13}>
                            <div style={{ textAlign: "center", fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase", color: "#6F6F6B" }}>{w}</div>
                          </Fragment>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "8px" }}>
                        {v.calendar.map((d, i14) => (
                          <Fragment key={i14}>
                            <div style={sx(d.style)}>{d.label}</div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", alignItems: "center", gap: "26px" }}>
                        <div style={{ position: "relative", width: "104px", height: "104px", flexShrink: "0" }}>
                          <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                            <circle cx="60" cy="60" r="52" fill="none" stroke="#EFEEEA" strokeWidth="10"></circle>
                            <circle cx="60" cy="60" r="52" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset={v.attendanceOffset} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}></circle>
                          </svg>
                          <div style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "25px", fontWeight: "600", letterSpacing: "-0.03em" }}>
                              {v.attendancePct}
                              <span style={{ fontSize: "14px", color: "#6F6F6B" }}>%</span>
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                            {v.attendanceStanding}
                          </div>
                          <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "8px", lineHeight: "1.5", maxWidth: "200px" }}>
                            {v.attMonthSummary}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                        {v.attTiles.map((t, i15) => (
                          <Fragment key={i15}>
                            <div style={{ padding: "22px 20px", borderRadius: "22px", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(23,23,23,0.045)" }}>
                              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "25px", fontWeight: "600", letterSpacing: "-0.03em" }}>{t.v}</div>
                              <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "8px" }}>{t.k}</div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                      <div style={{ padding: "26px 28px", borderRadius: "24px", background: "#F2F2EF", border: "1px solid rgba(23,23,23,0.04)" }}>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "14px" }}>Qeyd</div>
                        <p style={{ fontSize: "14.5px", lineHeight: "1.6", margin: "0", color: "#171717" }}>
                          {v.attNote}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {v.atHomework ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms" }}>
                  <div style={{ display: "flex", gap: "3px", padding: "4px", borderRadius: "14px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px)", border: "1px solid rgba(23,23,23,0.055)", width: "fit-content", marginBottom: "22px" }}>
                    {v.hwTabs.map((t, i16) => (
                      <Fragment key={i16}>
                        <button onClick={t.onGo} style={sx(t.style)}>{t.label}</button>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    {v.hwList.map((h, i17) => (
                      <Fragment key={i17}>
                        <div style={sx(h.rowStyle)}>
                          <span style={sx(h.iconStyle)}>
                            <i style={{ fontSize: "13px" }} className={h.icon}></i>
                          </span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "15px", fontWeight: "500", letterSpacing: "-0.008em" }}>{h.title}</div>
                            <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>{h.subject}</div>
                          </div>
                          <span style={sx(h.chipStyle)}>{h.status}</span>
                          {" "}
                          <span style={{ fontSize: "12.5px", color: "#6F6F6B", width: "96px", textAlign: "right", flexShrink: "0" }}>{h.due}</span>
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
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.02em" }}>Hər şey tamamlanıb.</div>
                        <div style={{ fontSize: "14px", color: "#6F6F6B", marginTop: "8px" }}>Bu filtrdə tapşırıq yoxdur.</div>
                      </div>
                    </>
                  ) : null}
                </section>
              </>
            ) : null}
            {v.atNotifications ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "760px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "7px 14px", borderRadius: "10px", background: "rgba(255,107,0,0.09)", fontSize: "12.5px", fontWeight: "600" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                      {v.unreadLabel}
                    </span>
                    <button style={{ padding: "9px 16px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(14px)", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", transition: "background 0.18s ease" }} onClick={v.onMarkAllRead} className="pp-h9">Hamısını oxundu işarələ</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                    {v.noNotifications ? (
                      <>
                        <div style={{ padding: "22px 26px", borderRadius: "22px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(23,23,23,0.045)", fontSize: "14px", color: "#6F6F6B" }}>Hələ bildiriş yoxdur.</div>
                      </>
                    ) : null}
                    {v.notifications.map((n, i18) => (
                      <Fragment key={i18}>
                        <div style={sx(n.rowStyle)} onClick={n.onOpen}>
                          <span style={sx(n.iconStyle)}>
                            <i style={{ fontSize: "13px" }} className={n.icon}></i>
                          </span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                              <span style={sx(n.titleStyle)}>{n.title}</span>
                              <span style={sx(n.dotStyle)}></span>
                            </div>
                            <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "6px", lineHeight: "1.5" }}>{n.body}</div>
                          </div>
                          <span style={{ fontSize: "12px", color: "#6F6F6B", flexShrink: "0" }}>{n.when}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
            {v.atSettings ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "720px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", alignItems: "center", gap: "20px" }}>
                    <span style={sx(v.parentAvatar2)}>
                      {v.parentInitials}
                    </span>
                    <div style={{ flex: "1", minWidth: "0" }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "19px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                        {v.parentName}
                      </div>
                      <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "5px" }}>
                        {v.parentEmail}
                      </div>
                    </div>
                    <button style={{ padding: "12px 20px", borderRadius: "13px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", transition: "background 0.18s ease" }} onClick={v.onChangeAvatar} className="pp-h7">Şəkli dəyiş</button>
                  </div>
                  <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "24px" }}>Şəxsi məlumat</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "18px" }}>
                      {v.fields.map((f, i19) => (
                        <Fragment key={i19}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#6F6F6B", marginBottom: "9px" }}>{f.label}</label>
                            {" "}
                            <input type="text" defaultValue={f.value} name={f.name} readOnly={f.readOnly} style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.1)", background: "#FCFCFA", fontSize: "14px", color: "#171717", outline: "none", transition: "border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease" }} className="pp-f10" />
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "8px" }}>Bildirişlər</div>
                    {v.toggles.map((t, i20) => (
                      <Fragment key={i20}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "22px 0 4px 0" }}>
                      <div style={{ flex: "1" }}>
                        <div style={{ fontSize: "14.5px", fontWeight: "500" }}>Dil</div>
                        <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>Portalın interfeys dili</div>
                      </div>
                      <div style={{ display: "flex", gap: "3px", padding: "4px", borderRadius: "13px", background: "#F2F2EF" }}>
                        {v.langTabs.map((l, i21) => (
                          <Fragment key={i21}>
                            <button onClick={l.onGo} style={sx(l.style)}>{l.label}</button>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{ padding: "15px 30px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 12px 26px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} onClick={v.onSaveProfile} className="pp-h11 pp-a3">Dəyişiklikləri yadda saxla</button>
                    <button style={{ padding: "15px 26px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} onClick={v.onCancelProfile} className="pp-h7">Ləğv et</button>
                  </div>
                </section>
              </>
            ) : null}
          </main>
        </div>
      </div>
      <div className="pp-mobile">
        <div style={{ position: "relative", zIndex: "1" }}>
          <div style={{ width: "100%", height: "100dvh", background: "#F7F7F5", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: "-180px", right: "-120px", width: "460px", height: "400px", background: "radial-gradient(closest-side,rgba(255,107,0,0.16),rgba(255,107,0,0) 76%)", filter: "blur(16px)", pointerEvents: "none" }}></div>
            <div style={{ flex: "1", overflowY: "auto", padding: "26px 22px 130px 22px", position: "relative", zIndex: "1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
                <div>
                  <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "25px", fontWeight: "600", letterSpacing: "-0.03em", lineHeight: "1.18", margin: "0" }}>
                    {v.mTitle}
                  </h1>
                  <p style={{ fontSize: "14px", color: "#6F6F6B", margin: "8px 0 0 0" }}>
                    {v.mSub}
                  </p>
                </div>
                <span style={sx(v.parentAvatar3)}>
                  {v.parentInitials}
                </span>
              </div>
              {v.mAtHome ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                    <div style={{ padding: "22px 20px", borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "32px", fontWeight: "600", letterSpacing: "-0.035em", lineHeight: "1" }}>
                          {v.attendancePct}
                        </span>
                        <span style={{ fontSize: "15px", color: "#6F6F6B", fontWeight: "500" }}>%</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "8px" }}>Davamiyyət</div>
                      <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", marginTop: "14px", overflow: "hidden" }}>
                        <div style={sx(v.mobileAttBar)}></div>
                      </div>
                    </div>
                    <div style={{ padding: "22px 20px", borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "32px", fontWeight: "600", letterSpacing: "-0.035em", lineHeight: "1" }}>
                          {v.progressPct}
                        </span>
                        <span style={{ fontSize: "15px", color: "#6F6F6B", fontWeight: "500" }}>%</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "8px" }}>İnkişaf</div>
                      <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", marginTop: "14px", overflow: "hidden" }}>
                        <div style={sx(v.mobileProgBar)}></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "24px", borderRadius: "26px", background: "rgba(255,255,255,0.66)", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset,0 20px 42px -30px rgba(23,23,23,0.3)", marginBottom: "26px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                      <span style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Növbəti dərs</span>
                    </div>
                    {v.hasNextLesson ? (
                      <>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.025em", lineHeight: "1.3" }}>
                          {v.lessonTitle}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "14px", fontSize: "13px" }}>
                          <span style={{ fontWeight: "600" }}>
                            {v.lessonWhen}
                          </span>
                          <span style={{ width: "1px", height: "12px", background: "rgba(23,23,23,0.14)" }}></span>
                          <span style={{ color: "#6F6F6B" }}>
                            {v.lessonDurationShort}
                          </span>
                        </div>
                        <button style={{ width: "100%", marginTop: "20px", padding: "14px", borderRadius: "14px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 10px 22px -10px rgba(255,107,0,0.6)" }} onClick={v.onGoLesson}>Dərsə keç</button>
                      </>
                    ) : null}
                    {v.noNextLesson ? (
                      <>
                        <div style={{ fontSize: "14px", fontWeight: "600" }}>Planlaşdırılmış dərs yoxdur.</div>
                      </>
                    ) : null}
                  </div>
                  <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px" }}>Öyrənmə inkişafı</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {v.subjects.map((s, i22) => (
                      <Fragment key={i22}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "500" }}>{s.name}</span>
                            <span style={{ fontSize: "13px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{s.pctLabel}</span>
                          </div>
                          <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                            <div style={sx(s.barStyle)}></div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {v.mAtProgress ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both" }}>
                    <div style={{ padding: "24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", marginBottom: "18px" }}>
                        <div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                            {v.chartTitle}
                          </div>
                          <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "6px" }}>
                            {v.chartRange}
                          </div>
                        </div>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 11px", borderRadius: "8px", background: "rgba(255,107,0,0.09)", fontSize: "11.5px", fontWeight: "600", whiteSpace: "nowrap" }}>
                          <i style={{ fontSize: "9px", color: "#E66000" }} className="fa-solid fa-arrow-trend-up"></i>
                          {v.chartDelta}
                        </span>
                      </div>
                      {v.hasTrend ? (
                        <>
                          <svg viewBox="0 0 420 150" preserveAspectRatio="none" style={{ width: "100%", height: "120px", display: "block", overflow: "visible" }}>
                            <defs>
                              <linearGradient id="pp-area-m" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.16"></stop>
                                <stop offset="100%" stopColor="#FF6B00" stopOpacity="0"></stop>
                              </linearGradient>
                            </defs>
                            <path d={v.chartArea} fill="url(#pp-area-m)"></path>
                            <path d={v.chartLine} fill="none" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                            {v.chartDots.map((d, i23) => (
                              <Fragment key={i23}>
                                <circle cx={d.x} cy={d.y} r={d.r} fill="#fff" stroke="#FF6B00" strokeWidth={d.sw}></circle>
                              </Fragment>
                            ))}
                          </svg>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px" }}>
                            {v.chartLabels.map((l, i24) => (
                              <Fragment key={i24}>
                                <span style={{ fontSize: "11px", color: "#6F6F6B", fontWeight: "500" }}>{l}</span>
                              </Fragment>
                            ))}
                          </div>
                        </>
                      ) : null}
                      {v.noTrend ? (
                        <>
                          <p style={{ fontSize: "13.5px", color: "#6F6F6B", margin: "0" }}>
                            Hələ kifayət qədər qiymət yoxdur. Qiymətlər daxil edildikcə inkişaf qrafiki burada görünəcək.
                          </p>
                        </>
                      ) : null}
                    </div>
                    <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", margin: "24px 0 18px 0" }}>Fənlər üzrə</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      {v.subjects.map((s, i25) => (
                        <Fragment key={i25}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                              <span style={{ fontSize: "14px", fontWeight: "500" }}>{s.name}</span>
                              <span style={{ fontSize: "13px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{s.pctLabel}</span>
                            </div>
                            <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                              <div style={sx(s.barStyle)}></div>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              {v.mAtAtt ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both" }}>
                    <div style={{ padding: "24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", display: "flex", alignItems: "center", gap: "20px", marginBottom: "14px" }}>
                      <div style={{ position: "relative", width: "92px", height: "92px", flexShrink: "0" }}>
                        <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#EFEEEA" strokeWidth="10"></circle>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset={v.attendanceOffset} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}></circle>
                        </svg>
                        <div style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.03em" }}>
                            {v.attendancePct}
                            <span style={{ fontSize: "13px", color: "#6F6F6B" }}>%</span>
                          </span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                          {v.attendanceStanding}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "7px", lineHeight: "1.5" }}>
                          {v.attMonthSummaryShort}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "22px" }}>
                      {v.attTiles.map((t, i26) => (
                        <Fragment key={i26}>
                          <div style={{ padding: "18px 16px", borderRadius: "20px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(23,23,23,0.045)" }}>
                            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.03em" }}>{t.v}</div>
                            <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "7px" }}>{t.k}</div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ padding: "22px 20px", borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "6px", marginBottom: "12px" }}>
                        {v.weekDays.map((w, i27) => (
                          <Fragment key={i27}>
                            <div style={{ textAlign: "center", fontSize: "9.5px", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase", color: "#6F6F6B" }}>{w}</div>
                          </Fragment>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "6px" }}>
                        {v.calendarMobile.map((d, i28) => (
                          <Fragment key={i28}>
                            <div style={sx(d.style)}>{d.label}</div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              {v.mAtHw ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both", display: "flex", flexDirection: "column", gap: "11px" }}>
                    {v.hwList.map((h, i29) => (
                      <Fragment key={i29}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(h.iconStyle)}>
                            <i style={{ fontSize: "12px" }} className={h.icon}></i>
                          </span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", letterSpacing: "-0.008em" }}>{h.title}</div>
                            <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "5px" }}>{h.subject}{" · "}{h.due}</div>
                          </div>
                          <span style={sx(h.chipStyle)}>{h.status}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {v.mAtMe ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both" }}>
                    <div style={{ padding: "26px 24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
                      <span style={sx(v.parentAvatar4)}>
                        {v.parentInitials}
                      </span>
                      <div style={{ minWidth: "0" }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                          {v.parentName}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>
                          {v.parentEmail}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "8px 22px 14px 22px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", marginBottom: "14px" }}>
                      {v.toggles.map((t, i30) => (
                        <Fragment key={i30}>
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
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px 0 6px 0" }}>
                        <div style={{ flex: "1" }}>
                          <div style={{ fontSize: "14px", fontWeight: "500" }}>Dil</div>
                        </div>
                        <div style={{ display: "flex", gap: "3px", padding: "4px", borderRadius: "13px", background: "#F2F2EF" }}>
                          {v.langTabs.map((l, i31) => (
                            <Fragment key={i31}>
                              <button onClick={l.onGo} style={sx(l.style)}>{l.label}</button>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", margin: "24px 0 16px 0" }}>Övladlarım</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                      {v.children.map((c, i32) => (
                        <Fragment key={i32}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                            <span style={sx(c.avatarList)}>{c.initials}</span>
                            <div style={{ flex: "1", minWidth: "0" }}>
                              <div style={{ fontSize: "14px", fontWeight: "600" }}>{c.name}</div>
                              <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "4px" }}>{c.meta}</div>
                            </div>
                            <span style={sx(c.tagStyle)}>{c.tag}</span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <button onClick={v.onLogout} style={{ width: "100%", marginTop: "14px", padding: "15px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} className="pp-h7">Çıxış</button>
                  </div>
                </>
              ) : null}
            </div>
            <div style={{ position: "absolute", bottom: "22px", left: "20px", right: "20px", zIndex: "5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2px", padding: "9px", borderRadius: "26px", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(26px) saturate(180%)", WebkitBackdropFilter: "blur(26px) saturate(180%)", border: "1px solid rgba(23,23,23,0.06)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset,0 20px 44px -22px rgba(23,23,23,0.4)" }}>
              {v.mobileNav.map((m, i33) => (
                <Fragment key={i33}>
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
