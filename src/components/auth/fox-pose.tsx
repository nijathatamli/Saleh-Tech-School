"use client";

import { createContext, useContext } from "react";

/** What the login mascot is doing: watches you, looks away while a password is typed, winks on success, wonders after a mistake. */
export type FoxPose = "watch" | "shy" | "wink" | "oops";

type Ctx = { pose: FoxPose; setPose: (p: FoxPose) => void };

export const FoxPoseContext = createContext<Ctx>({ pose: "watch", setPose: () => {} });
export const useFoxPose = () => useContext(FoxPoseContext);
