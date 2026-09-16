/* eslint-disable */
// GENERATED FILE — do not edit. Source: src/features/student-dashboard/template.html
// Regenerate with: node scripts/dc-template-to-tsx.mjs
import { Fragment } from "react";
import { sx } from "./sx";
import type { TemplateVals } from "./vals";

export function renderTemplate(v: TemplateVals) {
  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }} className="sd-root">
      <div style={{ position: "fixed", top: "-340px", right: "-220px", width: "1000px", height: "820px", background: "radial-gradient(closest-side,rgba(255,107,0,0.13),rgba(255,107,0,0) 78%)", filter: "blur(30px)", animation: "glow-drift 26s ease-in-out infinite", pointerEvents: "none", zIndex: "0" }}></div>
      <div style={{ position: "fixed", bottom: "-360px", left: "-200px", width: "820px", height: "720px", background: "radial-gradient(closest-side,rgba(255,107,0,0.075),rgba(255,107,0,0) 76%)", filter: "blur(34px)", pointerEvents: "none", zIndex: "0" }}></div>
      <div className="sd-desktop">
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
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F6B" }}>
                  {v.levelLabel}
                </span>
                <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#E66000" }}>
                  {v.levelPctLabel}
                </span>
              </div>
              <div style={{ height: "5px", borderRadius: "999px", background: "rgba(23,23,23,0.07)", overflow: "hidden", marginBottom: "9px" }}>
                <div style={sx(v.levelBar)}></div>
              </div>
              <div style={{ fontSize: "11.5px", color: "#6F6F6B" }}>
                {v.xpProgressLabel}
              </div>
            </div>
            <div style={{ flexShrink: "0", paddingTop: "18px", marginTop: "16px", borderTop: "1px solid rgba(23,23,23,0.06)", display: "flex", alignItems: "center", gap: "11px", paddingLeft: "8px" }}>
              <span style={sx(v.studentAvatar0)}>
                {v.studentInitials}
              </span>
              <div style={{ minWidth: "0" }}>
                <div style={{ fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v.studentName}
                </div>
                <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "1px" }}>
                  {v.levelTitle}
                </div>
              </div>
              <button onClick={v.onLogout} title="Çıxış" aria-label="Çıxış" style={{ marginLeft: "auto", width: "32px", height: "32px", borderRadius: "10px", border: "1px solid transparent", background: "transparent", color: "#6F6F6B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: "0", transition: "background 0.18s ease,color 0.18s ease" }} className="sd-h1">
                <i style={{ fontSize: "13px" }} className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>
          </nav>
          <main style={{ marginLeft: "280px", padding: "46px 46px 80px 24px", maxWidth: "1240px" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "32px", marginBottom: "44px", animation: "rise 0.5s ease both" }}>
              <div>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "40px", fontWeight: "600", letterSpacing: "-0.032em", lineHeight: "1.12", margin: "0" }}>
                  {v.pageTitle}
                </h1>
                <p style={{ fontSize: "16.5px", color: "#6F6F6B", margin: "12px 0 0 0", letterSpacing: "-0.005em" }}>
                  {v.pageSub}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: "0" }}>
                <button style={{ width: "40px", height: "40px", borderRadius: "14px", border: "1px solid rgba(23,23,23,0.055)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px) saturate(170%)", WebkitBackdropFilter: "blur(18px) saturate(170%)", color: "#4A4A46", cursor: "pointer", position: "relative", transition: "background 0.18s ease" }} className="sd-h2">
                  <i style={{ fontSize: "14px" }} className="fa-regular fa-bell"></i>
                  {" "}
                  <span style={sx(v.unreadDotStyle)}></span>
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "6px 8px 6px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px) saturate(170%)", WebkitBackdropFilter: "blur(18px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 10px 26px -18px rgba(23,23,23,0.3)" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "600", whiteSpace: "nowrap" }}>
                    {v.levelLabel}
                  </span>
                  <span style={sx(v.studentAvatar1)}>
                    {v.studentInitials}
                  </span>
                </div>
              </div>
            </header>
            {v.atHome ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px", paddingLeft: "2px" }}>Bu gün</div>
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
                              {v.lessonTitle}
                            </h2>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "20px 0 28px 0", fontSize: "14.5px" }}>
                              <span style={{ fontWeight: "600" }}>
                                {v.lessonWhen}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "22px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                              <span style={sx(v.lessonTeacherAvatar)}>
                                {v.lessonTeacherInitials}
                              </span>
                              <div style={{ flex: "1", minWidth: "0" }}>
                                <div style={{ fontSize: "13.5px", fontWeight: "600" }}>
                                  {v.lessonTeacher}
                                </div>
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>
                                  {v.lessonTeacherRole}
                                </div>
                              </div>
                            </div>
                            <button onClick={v.onGoLesson} style={{ width: "100%", marginTop: "26px", padding: "16px", borderRadius: "16px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", boxShadow: "0 14px 30px -12px rgba(255,107,0,0.7)", transition: "transform 0.18s ease" }} className="sd-h3 sd-a4">Dərsə bax →</button>
                          </>
                        ) : null}
                        {v.noNextLesson ? (
                          <>
                            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.025em", lineHeight: "1.3" }}>Planlaşdırılmış dərs yoxdur.</div>
                            <div style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.55)", marginTop: "12px" }}>Növbəti dərs təyin ediləndə burada görünəcək.</div>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ padding: "34px 36px", borderRadius: "28px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "22px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                        <span style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6F6F6B" }}>Bugünkü tapşırıq</span>
                      </div>
                      {v.hasTask ? (
                        <>
                          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "25px", fontWeight: "600", letterSpacing: "-0.028em", lineHeight: "1.26", margin: "0" }}>
                            {v.taskTitle}
                          </h2>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 0 0" }}>
                            <span style={{ padding: "6px 12px", borderRadius: "9px", background: "rgba(255,107,0,0.1)", color: "#E66000", fontSize: "11.5px", fontWeight: "600" }}>
                              {v.taskDue}
                            </span>
                            <span style={{ padding: "6px 12px", borderRadius: "9px", background: "#F2F2EF", color: "#4A4A46", fontSize: "11.5px", fontWeight: "600" }}>
                              {v.taskStatus}
                            </span>
                          </div>
                          <div style={{ margin: "28px 0 0 0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "9px" }}>
                              <span style={{ fontSize: "13px", color: "#6F6F6B" }}>Tamamlanma</span>
                              <span style={{ fontSize: "13.5px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>
                                {v.taskPctLabel}
                              </span>
                            </div>
                            <div style={{ height: "6px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                              <div style={sx(v.taskBar)}></div>
                            </div>
                          </div>
                          <div style={{ marginTop: "auto", paddingTop: "26px", display: "flex", alignItems: "center", gap: "12px" }}>
                            <button onClick={v.onStartTask} style={{ flex: "1", padding: "15px", borderRadius: "16px", border: "none", background: "#171717", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "transform 0.18s ease,opacity 0.18s ease" }} className="sd-h5 sd-a4">Tapşırığa başla →</button>
                            <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#6F6F6B", whiteSpace: "nowrap" }}>
                              {v.taskXp}
                            </span>
                          </div>
                        </>
                      ) : null}
                      {v.noTask ? (
                        <>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.025em", lineHeight: "1.3" }}>Hər şey tamamlanıb.</div>
                          <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "12px" }}>Gözləyən tapşırıq yoxdur.</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </section>
                {v.hasCourse ? (
                  <>
                    <section style={{ animation: "rise 0.5s ease both", animationDelay: "90ms", marginBottom: "20px" }}>
                      <div style={{ padding: "34px 36px", borderRadius: "28px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", alignItems: "center", gap: "36px", flexWrap: "wrap" }}>
                        <div style={{ flex: "1", minWidth: "260px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Öyrənməyə davam et</div>
                          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.028em", margin: "14px 0 10px 0" }}>
                            {v.courseName}
                          </h2>
                          <p style={{ fontSize: "14.5px", color: "#6F6F6B", margin: "0" }}>
                            {v.courseModuleLabel}
                          </p>
                          <div style={{ marginTop: "24px", maxWidth: "420px" }}>
                            <div style={{ height: "6px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                              <div style={sx(v.courseBar)}></div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "12.5px", color: "#6F6F6B" }}>
                              <span>
                                {v.coursePctLabel}
                              </span>
                              <span>
                                {v.courseLeftLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button style={{ padding: "17px 34px", borderRadius: "16px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", boxShadow: "0 14px 30px -12px rgba(255,107,0,0.6)", transition: "transform 0.18s ease" }} onClick={v.onContinue} className="sd-h3 sd-a4">Davam et →</button>
                      </div>
                    </section>
                  </>
                ) : null}
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px", marginBottom: "20px", animation: "rise 0.5s ease both", animationDelay: "140ms" }}>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", marginBottom: "6px" }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "34px", fontWeight: "600", letterSpacing: "-0.035em", lineHeight: "1" }}>
                        {v.xpDisplay}
                        <span style={{ fontSize: "17px", color: "#6F6F6B", fontWeight: "500", marginLeft: "6px" }}>XP</span>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 11px", borderRadius: "8px", background: "rgba(255,107,0,0.09)", fontSize: "11.5px", fontWeight: "600", whiteSpace: "nowrap" }}>
                        <i style={{ fontSize: "9px", color: "#E66000" }} className="fa-solid fa-arrow-trend-up"></i>
                        {v.xpMonthLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginBottom: "26px" }}>
                      {v.nextLevelLabel}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1px", borderRadius: "16px", overflow: "hidden", background: "rgba(23,23,23,0.055)" }}>
                      {v.xpSources.map((x, i1) => (
                        <Fragment key={i1}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "#fff" }}>
                            <span style={{ width: "32px", height: "32px", borderRadius: "11px", background: "#F2F2EF", color: "#4A4A46", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0" }}>
                              <i style={{ fontSize: "12px" }} className={x.icon}></i>
                            </span>
                            <span style={{ flex: "1", fontSize: "13.5px", fontWeight: "500" }}>{x.label}</span>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#E66000", whiteSpace: "nowrap" }}>{x.xp}</span>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "26px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>
                          {v.levelLabel}
                        </div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.025em", marginTop: "10px" }}>
                          {v.levelTitle}
                        </div>
                      </div>
                      <div style={{ position: "relative", width: "76px", height: "76px", flexShrink: "0" }}>
                        <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#EFEEEA" strokeWidth="11"></circle>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#FF6B00" strokeWidth="11" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset={v.levelOffset} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}></circle>
                        </svg>
                        <div style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em" }}>
                            {v.levelNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(23,23,23,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "18px" }}>
                        <span style={{ fontSize: "14px" }}>🔥</span>
                        <span style={{ fontSize: "14.5px", fontWeight: "600" }}>
                          {v.streakLabel}
                        </span>
                        <span style={{ fontSize: "12.5px", color: "#6F6F6B" }}>· Davam et!</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "7px" }}>
                        {v.streak.map((s, i2) => (
                          <Fragment key={i2}>
                            <div style={{ textAlign: "center" }}>
                              <div style={sx(s.cellStyle)}>
                                <i style={{ fontSize: "10px" }} className={s.icon}></i>
                              </div>
                              <div style={{ fontSize: "10px", color: "#6F6F6B", marginTop: "7px" }}>{s.day}</div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                {v.hasRecommendation ? (
                  <>
                    <section style={{ animation: "rise 0.5s ease both", animationDelay: "190ms", marginBottom: "20px" }}>
                      <div style={{ padding: "32px 34px", borderRadius: "26px", background: "rgba(255,255,255,0.62)", backdropFilter: "blur(22px) saturate(170%)", WebkitBackdropFilter: "blur(22px) saturate(170%)", border: "1px solid rgba(23,23,23,0.055)", boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset,0 22px 48px -32px rgba(23,23,23,0.3)", display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
                        <div style={{ flex: "1", minWidth: "280px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Sənə növbəti addımı tövsiyə edirik</div>
                          <p style={{ fontSize: "14.5px", color: "#6F6F6B", margin: "16px 0 12px 0" }}>
                            {v.recoIntro}
                          </p>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "22px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                            {v.recoTitle}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "14px", fontSize: "13px", color: "#6F6F6B" }}>
                            <i style={{ fontSize: "11px" }} className="fa-regular fa-clock"></i>
                            {v.recoDuration}
                            <span style={{ width: "1px", height: "12px", background: "rgba(23,23,23,0.14)" }}></span>
                            {v.recoXp}
                          </div>
                        </div>
                        <button style={{ padding: "16px 32px", borderRadius: "16px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", transition: "background 0.18s ease,transform 0.18s ease" }} onClick={v.onReco} className="sd-h6 sd-a4">Başla →</button>
                      </div>
                    </section>
                  </>
                ) : null}
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "240ms", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "18px", paddingLeft: "2px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Mənim layihələrim</div>
                    <span style={{ fontSize: "12.5px", fontWeight: "600", color: "#6F6F6B" }}>
                      {v.projectsCountLabel}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "20px" }}>
                    {v.projects.map((p, i3) => (
                      <Fragment key={i3}>
                        <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s ease,box-shadow 0.2s ease" }} className="sd-h7">
                          <div style={sx(p.artStyle)}>
                            <i style={sx(p.iconStyle)} className={p.icon}></i>
                          </div>
                          <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", flex: "1" }}>
                            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em" }}>{p.name}</div>
                            <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "7px" }}>{p.tech}</div>
                            <div style={{ marginTop: "22px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                                <span style={sx(p.statusStyle)}>{p.status}</span>
                                <span style={{ fontSize: "13px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{p.pctLabel}</span>
                              </div>
                              <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                                <div style={sx(p.barStyle)}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  {v.noProjects ? (
                    <>
                      <div style={{ padding: "46px 24px", textAlign: "center", borderRadius: "26px", background: "rgba(255,255,255,0.5)", border: "1px dashed rgba(23,23,23,0.13)" }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>Hələ layihə yoxdur</div>
                        <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "8px" }}>İlk layihəni tamamladıqda burada görünəcək.</div>
                      </div>
                    </>
                  ) : null}
                </section>
                <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "20px", animation: "rise 0.5s ease both", animationDelay: "290ms" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px", paddingLeft: "2px" }}>Nailiyyətlər</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px" }}>
                      {v.achievements.map((a, i4) => (
                        <Fragment key={i4}>
                          <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "16px 18px", borderRadius: "20px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", transition: "transform 0.18s ease,box-shadow 0.18s ease" }} className="sd-h8">
                            <span style={sx(a.medalStyle)}>
                              <i style={{ fontSize: "13px" }} className={a.icon}></i>
                            </span>
                            <div style={{ minWidth: "0" }}>
                              <div style={sx(a.nameStyle)}>{a.name}</div>
                              <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "4px" }}>{a.meta}</div>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    {v.noAchievements ? (
                      <>
                        <div style={{ padding: "36px 24px", textAlign: "center", borderRadius: "20px", background: "rgba(255,255,255,0.5)", border: "1px dashed rgba(23,23,23,0.13)" }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "15px", fontWeight: "600", letterSpacing: "-0.02em" }}>İlk nailiyyət gözləyir.</div>
                          <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "6px" }}>Öyrənməyə davam et.</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px", paddingLeft: "2px" }}>Son fəaliyyət</div>
                    <div style={{ display: "flex", flexDirection: "column", paddingLeft: "2px" }}>
                      {v.activity.map((v, i5) => (
                        <Fragment key={i5}>
                          <div style={{ display: "flex", gap: "16px", padding: "14px 0" }}>
                            <span style={{ fontSize: "12px", color: "#6F6F6B", width: "74px", flexShrink: "0", paddingTop: "1px" }}>
                              {v.when}
                            </span>
                            <span style={sx(v.dotStyle)}></span>
                            <span style={{ flex: "1", fontSize: "14px", fontWeight: "450", letterSpacing: "-0.005em" }}>
                              {v.what}
                            </span>
                            <span style={sx(v.xpStyle)}>
                              {v.xp}
                            </span>
                          </div>
                        </Fragment>
                      ))}
                      {v.noActivity ? (
                        <>
                          <div style={{ padding: "14px 0", fontSize: "14px", color: "#6F6F6B" }}>Hələ fəaliyyət yoxdur.</div>
                        </>
                      ) : null}
                    </div>
                    {v.hasChallenge ? (
                      <>
                        <div style={{ marginTop: "22px", padding: "26px 28px", borderRadius: "24px", background: "#F2F2EF", border: "1px solid rgba(23,23,23,0.04)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>Bugünkü challenge</div>
                            <span style={{ padding: "5px 11px", borderRadius: "8px", background: "rgba(255,107,0,0.1)", color: "#E66000", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap" }}>+50 XP</span>
                          </div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.022em", lineHeight: "1.35" }}>Bu kodda zəiflik hansı sətirdədir?</div>
                          <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "12px" }}>Səviyyə: Orta</div>
                          <button style={{ width: "100%", marginTop: "22px", padding: "14px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease,transform 0.18s ease" }} className="sd-h6 sd-a4">Challenge-a başla</button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              </>
            ) : null}
            {v.atProgress ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px", marginBottom: "20px" }}>
                    <div style={{ padding: "36px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", textAlign: "center" }}>
                      <div style={{ position: "relative", width: "170px", height: "170px", margin: "0 auto" }}>
                        <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#EFEEEA" strokeWidth="9"></circle>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#FF6B00" strokeWidth="9" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset={v.overallOffset} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}></circle>
                        </svg>
                        <div style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "40px", fontWeight: "600", letterSpacing: "-0.035em" }}>
                            {v.overallPct}
                            <span style={{ fontSize: "19px", color: "#6F6F6B" }}>%</span>
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6F6F6B", marginTop: "24px" }}>Ümumi inkişaf</div>
                      <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "10px" }}>
                        {v.overallNote}
                      </div>
                    </div>
                    <div style={{ padding: "34px 36px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "21px", fontWeight: "600", letterSpacing: "-0.025em", margin: "0 0 28px 0" }}>Sənin inkişafın</h2>
                      <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                        {v.subjects.map((s, i6) => (
                          <Fragment key={i6}>
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
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "34px 36px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "26px" }}>
                      <div>
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "19px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0" }}>
                          {v.chartTitle}
                        </h2>
                        <p style={{ fontSize: "13.5px", color: "#6F6F6B", margin: "8px 0 0 0" }}>
                          {v.chartRange}
                        </p>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 11px", borderRadius: "8px", background: "rgba(255,107,0,0.09)", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                        <i style={{ fontSize: "10px", color: "#E66000" }} className="fa-solid fa-arrow-trend-up"></i>
                        {v.chartDelta}
                      </span>
                    </div>
                    {v.hasTrend ? (
                      <>
                        <svg viewBox="0 0 420 150" preserveAspectRatio="none" style={{ width: "100%", height: "150px", display: "block", overflow: "visible" }}>
                          <defs>
                            <linearGradient id="sd-area" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.16"></stop>
                              <stop offset="100%" stopColor="#FF6B00" stopOpacity="0"></stop>
                            </linearGradient>
                          </defs>
                          <path d={v.chartArea} fill="url(#sd-area)"></path>
                          <path d={v.chartLine} fill="none" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                          {v.chartDots.map((d, i7) => (
                            <Fragment key={i7}>
                              <circle cx={d.x} cy={d.y} r={d.r} fill="#fff" stroke="#FF6B00" strokeWidth={d.sw}></circle>
                            </Fragment>
                          ))}
                        </svg>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                          {v.chartLabels.map((l, i8) => (
                            <Fragment key={i8}>
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
                </section>
              </>
            ) : null}
            {v.atLessons ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", display: "flex", flexDirection: "column", gap: "20px" }}>
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
                        <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "8px", lineHeight: "1.5", maxWidth: "220px" }}>
                          {v.attMonthSummary}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                      {v.attTiles.map((t, i9) => (
                        <Fragment key={i9}>
                          <div style={{ padding: "22px 20px", borderRadius: "22px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(23,23,23,0.045)" }}>
                            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "25px", fontWeight: "600", letterSpacing: "-0.03em" }}>{t.v}</div>
                            <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "8px" }}>{t.k}</div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ padding: "30px 32px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "22px", flexWrap: "wrap" }}>
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0" }}>
                          {v.attMonthName}
                        </h2>
                        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11.5px", color: "#6F6F6B" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "#FF6B00" }}></span>
                            İştirak
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11.5px", color: "#6F6F6B" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "rgba(23,23,23,0.28)" }}></span>
                            Gecikmə
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11.5px", color: "#6F6F6B" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "rgba(23,23,23,0.12)" }}></span>
                            Qayıb
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "8px", marginBottom: "12px" }}>
                        {v.weekDays.map((w, i10) => (
                          <Fragment key={i10}>
                            <div style={{ textAlign: "center", fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase", color: "#6F6F6B" }}>{w}</div>
                          </Fragment>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "8px" }}>
                        {v.attCalendar.map((d, i11) => (
                          <Fragment key={i11}>
                            <div style={sx(d.style)}>{d.label}</div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    <div style={{ padding: "24px 30px", borderBottom: "1px solid rgba(23,23,23,0.055)" }}>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.02em", margin: "0" }}>Qarşıdakı dərslər</h2>
                    </div>
                    {v.lessons.map((l, i12) => (
                      <Fragment key={i12}>
                        <div style={sx(l.rowStyle)}>
                          <span style={sx(l.dayStyle)}>{l.dayShort}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14.5px", fontWeight: "500", letterSpacing: "-0.008em" }}>{l.course}</div>
                            <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>{l.teacher}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: "0" }}>
                            <div style={sx(l.timeStyle)}>{l.time}</div>
                            <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "5px" }}>{l.day}</div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                    {v.noLessons ? (
                      <>
                        <div style={{ padding: "24px 30px", fontSize: "14px", color: "#6F6F6B" }}>Planlaşdırılmış dərs yoxdur.</div>
                      </>
                    ) : null}
                  </div>
                </section>
              </>
            ) : null}
            {v.atTasks ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms" }}>
                  <div style={{ display: "flex", gap: "3px", padding: "4px", borderRadius: "14px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(18px)", border: "1px solid rgba(23,23,23,0.055)", width: "fit-content", marginBottom: "22px" }}>
                    {v.hwTabs.map((t, i13) => (
                      <Fragment key={i13}>
                        <button onClick={t.onGo} style={sx(t.style)}>{t.label}</button>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    {v.hwList.map((h, i14) => (
                      <Fragment key={i14}>
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
                          <span style={{ fontSize: "12.5px", color: "#6F6F6B", width: "104px", textAlign: "right", flexShrink: "0" }}>{h.due}</span>
                          {h.canSubmit ? (
                            <>
                              <button onClick={h.onSubmit} style={{ padding: "9px 16px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", transition: "background 0.18s ease" }} className="sd-h9">Təhvil ver</button>
                            </>
                          ) : null}
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
            {v.atPortfolio ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
                    <span style={sx(v.studentAvatar2)}>
                      {v.studentInitials}
                    </span>
                    <div style={{ flex: "1", minWidth: "180px" }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                        {v.studentName}
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                        {v.enrollments.map((e, i15) => (
                          <Fragment key={i15}>
                            <span style={{ padding: "6px 12px", borderRadius: "9px", background: "#F2F2EF", color: "#4A4A46", fontSize: "11.5px", fontWeight: "600" }}>{e}</span>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "20px", alignItems: "start" }}>
                    <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                      <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "26px" }}>Bacarıqlar</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                        {v.skills.map((s, i16) => (
                          <Fragment key={i16}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "9px" }}>
                                <span style={{ fontSize: "14px", fontWeight: "500" }}>{s.name}</span>
                                <span style={{ fontSize: "13.5px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{s.pctLabel}</span>
                              </div>
                              <div style={{ height: "6px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                                <div style={sx(s.barStyle)}></div>
                              </div>
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px", paddingLeft: "2px" }}>Layihələr</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "20px" }}>
                          {v.projects.map((p, i17) => (
                            <Fragment key={i17}>
                              <div style={{ borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden", transition: "transform 0.2s ease,box-shadow 0.2s ease" }} className="sd-h7">
                                <div style={sx(p.artStyle)}>
                                  <i style={sx(p.iconStyle)} className={p.icon}></i>
                                </div>
                                <div style={{ padding: "22px 24px" }}>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>{p.name}</div>
                                  <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "7px" }}>{p.tech}</div>
                                  <div style={{ marginTop: "18px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                                      <span style={sx(p.statusStyle)}>{p.status}</span>
                                      <span style={{ fontSize: "12.5px", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{p.pctLabel}</span>
                                    </div>
                                    <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden" }}>
                                      <div style={sx(p.barStyle)}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "18px", paddingLeft: "2px" }}>Sertifikatlar</div>
                        <div style={{ padding: "46px 24px", textAlign: "center", borderRadius: "24px", background: "rgba(255,255,255,0.5)", border: "1px dashed rgba(23,23,23,0.13)" }}>
                          <span style={{ width: "44px", height: "44px", borderRadius: "15px", background: "#F2F2EF", color: "#6F6F6B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                            <i style={{ fontSize: "15px" }} className="fa-solid fa-award"></i>
                          </span>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>Hələ sertifikat yoxdur</div>
                          <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "8px", maxWidth: "280px", marginLeft: "auto", marginRight: "auto" }}>Kursu tamamladıqda sertifikatın burada görünəcək.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
            {v.atLeaderboard ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "820px" }}>
                  <div style={{ borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", overflow: "hidden" }}>
                    {v.leaderboard.map((r, i18) => (
                      <Fragment key={i18}>
                        <div style={sx(r.rowStyle)}>
                          <span style={sx(r.rankStyle)}>{r.rank}</span>
                          {" "}
                          <span style={sx(r.avatarStyle)}>{r.initials}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={sx(r.nameStyle)}>{r.name}</div>
                            <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>{r.meta}</div>
                          </div>
                          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "15px", fontWeight: "600", fontVariantNumeric: "tabular-nums", flexShrink: "0" }}>{r.points}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </section>
              </>
            ) : null}
            {v.atProfile ? (
              <>
                <section style={{ animation: "rise 0.5s ease both", animationDelay: "40ms", maxWidth: "760px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ padding: "34px 36px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)", display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap" }}>
                    <span style={sx(v.studentAvatar3)}>
                      {v.studentInitials}
                    </span>
                    <div style={{ flex: "1", minWidth: "180px" }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.025em" }}>
                        {v.studentName}
                      </div>
                      <div style={{ fontSize: "13.5px", color: "#6F6F6B", marginTop: "7px" }}>
                        {v.studentMeta}
                      </div>
                    </div>
                    <span style={{ padding: "8px 15px", borderRadius: "10px", background: "rgba(255,107,0,0.1)", color: "#E66000", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                      {v.levelTitle}{" · "}{v.levelLabel}
                    </span>
                    <button onClick={v.onChangeAvatar} style={{ padding: "9px 16px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", transition: "background 0.18s ease" }} className="sd-h9">Şəkli dəyiş</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "20px" }}>
                    {v.profileStats.map((p, i19) => (
                      <Fragment key={i19}>
                        <div style={{ padding: "24px 26px", borderRadius: "22px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(23,23,23,0.045)" }}>
                          <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B" }}>{p.k}</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "28px", fontWeight: "600", letterSpacing: "-0.032em", marginTop: "12px" }}>{p.v}</div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ padding: "32px 34px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", boxShadow: "0 1px 2px rgba(23,23,23,0.03)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "22px" }}>Bütün nailiyyətlər</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "11px" }}>
                      {v.achievements.map((a, i20) => (
                        <Fragment key={i20}>
                          <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "16px 18px", borderRadius: "20px", background: "#FCFCFA", border: "1px solid rgba(23,23,23,0.05)" }}>
                            <span style={sx(a.medalStyle)}>
                              <i style={{ fontSize: "13px" }} className={a.icon}></i>
                            </span>
                            <div style={{ minWidth: "0" }}>
                              <div style={sx(a.nameStyle)}>{a.name}</div>
                              <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "4px" }}>{a.meta}</div>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </main>
        </div>
      </div>
      <div className="sd-mobile">
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
                <span style={sx(v.studentAvatar4)}>
                  {v.studentInitials}
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
                            {v.lessonTitle}
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "12px" }}>
                            {v.lessonWhen}
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
                            {v.lessonTeacher}
                          </div>
                          <button onClick={v.onGoLesson} style={{ width: "100%", marginTop: "20px", padding: "14px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 10px 22px -10px rgba(255,107,0,0.7)" }}>Dərsə bax →</button>
                        </>
                      ) : null}
                      {v.noNextLesson ? (
                        <>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.025em", lineHeight: "1.3" }}>Planlaşdırılmış dərs yoxdur.</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>Növbəti dərs təyin ediləndə burada görünəcək.</div>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ padding: "24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B00" }}></span>
                      <span style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6F6F6B" }}>Bugünkü tapşırıq</span>
                    </div>
                    {v.hasTask ? (
                      <>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.022em", lineHeight: "1.32" }}>
                          {v.taskTitle}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginTop: "14px" }}>
                          <span style={{ padding: "5px 11px", borderRadius: "8px", background: "rgba(255,107,0,0.1)", color: "#E66000", fontSize: "11px", fontWeight: "600" }}>
                            {v.taskDue}
                          </span>
                          <span style={{ fontSize: "12px", color: "#6F6F6B" }}>
                            {v.taskXp}
                          </span>
                        </div>
                        <button onClick={v.onStartTask} style={{ width: "100%", marginTop: "18px", padding: "14px", borderRadius: "15px", border: "none", background: "#171717", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }}>Tapşırığa başla →</button>
                      </>
                    ) : null}
                    {v.noTask ? (
                      <>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "17px", fontWeight: "600", letterSpacing: "-0.022em", lineHeight: "1.32" }}>Hər şey tamamlanıb.</div>
                        <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "8px" }}>Gözləyən tapşırıq yoxdur.</div>
                      </>
                    ) : null}
                  </div>
                  {v.hasCourse ? (
                    <>
                      <div style={{ padding: "24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", marginBottom: "12px" }}>
                        <div style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6F6F6B" }}>Öyrənməyə davam et</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "19px", fontWeight: "600", letterSpacing: "-0.025em", margin: "12px 0 6px 0" }}>
                          {v.courseName}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#6F6F6B" }}>
                          {v.courseModuleShort}
                        </div>
                        <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", overflow: "hidden", marginTop: "16px" }}>
                          <div style={sx(v.courseBar)}></div>
                        </div>
                        <button style={{ width: "100%", marginTop: "18px", padding: "14px", borderRadius: "15px", border: "none", background: "#FF6B00", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", boxShadow: "0 10px 22px -10px rgba(255,107,0,0.6)" }} onClick={v.onContinue}>Davam et →</button>
                      </div>
                    </>
                  ) : null}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "26px" }}>
                    <div style={{ padding: "22px 20px", borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.035em", lineHeight: "1" }}>
                        {v.xpDisplay}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "8px" }}>{"XP · "}{v.levelLabel}</div>
                      <div style={{ height: "5px", borderRadius: "999px", background: "#F0EFEB", marginTop: "14px", overflow: "hidden" }}>
                        <div style={sx(v.levelBar)}></div>
                      </div>
                    </div>
                    <div style={{ padding: "22px 20px", borderRadius: "24px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.035em", lineHeight: "1" }}>
                        {v.streakDays}{" 🔥"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "8px" }}>Günlük seriya</div>
                      <div style={{ display: "flex", gap: "4px", marginTop: "14px" }}>
                        {v.streak.map((s, i21) => (
                          <Fragment key={i21}>
                            <span style={sx(s.pipStyle)}></span>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "16px" }}>Nailiyyətlər</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "26px" }}>
                    {v.achievementsTop.map((a, i22) => (
                      <Fragment key={i22}>
                        <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "16px 18px", borderRadius: "20px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(a.medalStyle)}>
                            <i style={{ fontSize: "12px" }} className={a.icon}></i>
                          </span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={sx(a.nameStyle)}>{a.name}</div>
                            <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "4px" }}>{a.meta}</div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                  <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "16px" }}>Layihələrim</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                    {v.projects.map((p, i23) => (
                      <Fragment key={i23}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(p.chipArtStyle)}>
                            <i style={{ fontSize: "13px" }} className={p.icon}></i>
                          </span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14px", fontWeight: "600" }}>{p.name}</div>
                            <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "4px" }}>{p.tech}</div>
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: "600", fontVariantNumeric: "tabular-nums", flexShrink: "0" }}>{p.pctLabel}</span>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : null}
              {v.mAtProgress ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both" }}>
                    <div style={{ padding: "26px 24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", textAlign: "center", marginBottom: "14px" }}>
                      <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto" }}>
                        <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#EFEEEA" strokeWidth="10"></circle>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset={v.overallOffset} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}></circle>
                        </svg>
                        <div style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "32px", fontWeight: "600", letterSpacing: "-0.035em" }}>
                            {v.overallPct}
                            <span style={{ fontSize: "16px", color: "#6F6F6B" }}>%</span>
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6F6F6B", marginTop: "20px" }}>Ümumi inkişaf</div>
                    </div>
                    <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", margin: "24px 0 16px 0" }}>Fənlər üzrə</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                      {v.subjects.map((s, i24) => (
                        <Fragment key={i24}>
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
              {v.mAtLessons ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both", display: "flex", flexDirection: "column", gap: "11px" }}>
                    <div style={{ padding: "24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", display: "flex", alignItems: "center", gap: "20px", marginBottom: "3px" }}>
                      <div style={{ position: "relative", width: "88px", height: "88px", flexShrink: "0" }}>
                        <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#EFEEEA" strokeWidth="10"></circle>
                          <circle cx="60" cy="60" r="52" fill="none" stroke="#FF6B00" strokeWidth="10" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset={v.attendanceOffset} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}></circle>
                        </svg>
                        <div style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "21px", fontWeight: "600", letterSpacing: "-0.03em" }}>
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
                    <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", margin: "14px 0 4px 0" }}>Qarşıdakı dərslər</div>
                    {v.lessons.map((l, i25) => (
                      <Fragment key={i25}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(l.dayStyle)}>{l.dayShort}</span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500" }}>{l.course}</div>
                            <div style={{ fontSize: "11.5px", color: "#6F6F6B", marginTop: "4px" }}>{l.teacher}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: "0" }}>
                            <div style={sx(l.timeStyle)}>{l.time}</div>
                            <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "4px" }}>{l.day}</div>
                          </div>
                        </div>
                      </Fragment>
                    ))}
                    {v.noLessons ? (
                      <>
                        <div style={{ padding: "18px 20px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", fontSize: "13px", color: "#6F6F6B" }}>Planlaşdırılmış dərs yoxdur.</div>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
              {v.mAtTasks ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both", display: "flex", flexDirection: "column", gap: "11px" }}>
                    {v.hwList.map((h, i26) => (
                      <Fragment key={i26}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                          <span style={sx(h.iconStyle)}>
                            <i style={{ fontSize: "12px" }} className={h.icon}></i>
                          </span>
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", letterSpacing: "-0.008em" }}>{h.title}</div>
                            <div style={{ fontSize: "12px", color: "#6F6F6B", marginTop: "5px" }}>{h.subject}{" · "}{h.due}</div>
                          </div>
                          <span style={sx(h.chipStyle)}>{h.status}</span>
                          {h.canSubmit ? (
                            <>
                              <button onClick={h.onSubmit} style={{ padding: "9px 16px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", transition: "background 0.18s ease" }} className="sd-h9">Təhvil ver</button>
                            </>
                          ) : null}
                        </div>
                      </Fragment>
                    ))}
                    {v.hwEmpty ? (
                      <>
                        <div style={{ padding: "36px 20px", textAlign: "center", borderRadius: "22px", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(23,23,23,0.045)" }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.02em" }}>Hər şey tamamlanıb.</div>
                          <div style={{ fontSize: "13px", color: "#6F6F6B", marginTop: "6px" }}>Gözləyən tapşırıq yoxdur.</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
              {v.mAtProfile ? (
                <>
                  <div style={{ animation: "rise-sm 0.34s ease both" }}>
                    <div style={{ padding: "26px 24px", borderRadius: "26px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)", display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                      <span style={sx(v.studentAvatar5)}>
                        {v.studentInitials}
                      </span>
                      <div style={{ minWidth: "0" }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "18px", fontWeight: "600", letterSpacing: "-0.022em" }}>
                          {v.studentName}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#6F6F6B", marginTop: "5px" }}>
                          {v.studentMeta}
                        </div>
                      </div>
                      <button onClick={v.onChangeAvatar} style={{ padding: "9px 16px", borderRadius: "11px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap", flexShrink: "0", transition: "background 0.18s ease" }} className="sd-h9">Şəkli dəyiş</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "26px" }}>
                      {v.profileStats.map((p, i27) => (
                        <Fragment key={i27}>
                          <div style={{ padding: "20px 18px", borderRadius: "22px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                            <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6F6F6B" }}>{p.k}</div>
                            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "24px", fontWeight: "600", letterSpacing: "-0.032em", marginTop: "10px" }}>{p.v}</div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <div style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.09em", textTransform: "uppercase", color: "#6F6F6B", marginBottom: "16px" }}>Nailiyyətlər</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {v.achievements.map((a, i28) => (
                        <Fragment key={i28}>
                          <div style={{ display: "flex", alignItems: "center", gap: "13px", padding: "16px 18px", borderRadius: "20px", background: "#fff", border: "1px solid rgba(23,23,23,0.05)" }}>
                            <span style={sx(a.medalStyle)}>
                              <i style={{ fontSize: "12px" }} className={a.icon}></i>
                            </span>
                            <div style={{ flex: "1", minWidth: "0" }}>
                              <div style={sx(a.nameStyle)}>{a.name}</div>
                              <div style={{ fontSize: "11px", color: "#6F6F6B", marginTop: "4px" }}>{a.meta}</div>
                            </div>
                          </div>
                        </Fragment>
                      ))}
                    </div>
                    <button onClick={v.onLogout} style={{ width: "100%", marginTop: "14px", padding: "15px", borderRadius: "15px", border: "1px solid rgba(23,23,23,0.09)", background: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer", transition: "background 0.18s ease" }} className="sd-h9">Çıxış</button>
                  </div>
                </>
              ) : null}
            </div>
            <div style={{ position: "absolute", bottom: "22px", left: "20px", right: "20px", zIndex: "5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2px", padding: "9px", borderRadius: "26px", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(26px) saturate(180%)", WebkitBackdropFilter: "blur(26px) saturate(180%)", border: "1px solid rgba(23,23,23,0.06)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset,0 20px 44px -22px rgba(23,23,23,0.4)" }}>
              {v.mobileNav.map((m, i29) => (
                <Fragment key={i29}>
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
