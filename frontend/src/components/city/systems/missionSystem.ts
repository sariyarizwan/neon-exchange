/**
 * Mini-mission state machine for district missions.
 * Each mission has 3 steps: trigger → interact → reveal.
 * Manages progression, visual feedback, and completion effects.
 */

import { useNeonStore } from "@/store/useNeonStore";
import type { ActiveMission } from "@/types/world";

export type MissionCheckResult =
  | { matched: false }
  | { matched: true; advanceOrComplete: "advance" | "complete"; message: string };

/**
 * Check if a click on an NPC or object matches the current mission step.
 * Returns whether the mission should advance and what message to show.
 */
export function checkMissionProgress(
  activeMission: ActiveMission | null,
  clickedType: "npc" | "object",
  clickedRole?: string,
  clickedObjectType?: string,
  missionStepTargets?: ReadonlyArray<{
    targetType: "npc" | "object";
    targetRole?: string;
    targetObjectType?: string;
    onCompleteMessage: string;
  }>
): MissionCheckResult {
  if (!activeMission || !missionStepTargets) {
    return { matched: false };
  }

  const currentStep = missionStepTargets[activeMission.currentStep];
  if (!currentStep) {
    return { matched: false };
  }

  const typeMatch = currentStep.targetType === clickedType;
  const roleMatch = !currentStep.targetRole || currentStep.targetRole === clickedRole;
  const objectMatch = !currentStep.targetObjectType || currentStep.targetObjectType === clickedObjectType;

  if (!typeMatch || !roleMatch || !objectMatch) {
    return { matched: false };
  }

  const isLastStep = activeMission.currentStep >= missionStepTargets.length - 1;

  return {
    matched: true,
    advanceOrComplete: isLastStep ? "complete" : "advance",
    message: currentStep.onCompleteMessage,
  };
}

/**
 * Process a mission step result — advance or complete the mission.
 */
export function processMissionResult(
  result: MissionCheckResult & { matched: true },
  missionCompletionEffect?: {
    districtId: string;
    effectType: string;
    duration: number;
    primaryColor: string;
    secondaryColor: string;
  }
): void {
  const store = useNeonStore.getState();

  if (result.advanceOrComplete === "advance") {
    store.advanceMission();
    store.addQuestToast(result.message, "mission-step", store.activeMission?.districtId ?? null);
  } else {
    store.completeMission();
    store.addQuestToast(result.message, "mission-complete", missionCompletionEffect?.districtId ?? null);

    if (missionCompletionEffect) {
      store.activateDistrict(
        missionCompletionEffect.districtId,
        missionCompletionEffect.effectType,
        missionCompletionEffect.duration,
        missionCompletionEffect.primaryColor,
        missionCompletionEffect.secondaryColor
      );
    }
  }
}

/**
 * Get the current mission step instruction for UI display.
 */
export function getMissionInstruction(
  activeMission: ActiveMission | null,
  missionSteps?: ReadonlyArray<{ instruction: string }>
): string | null {
  if (!activeMission || !missionSteps) {
    return null;
  }

  const step = missionSteps[activeMission.currentStep];
  return step?.instruction ?? null;
}

/**
 * Check if a mission is available for a district (not already completed or active).
 */
export function isMissionAvailable(
  districtId: string,
  missionId: string,
  activeMission: ActiveMission | null,
  completedMissions: readonly string[]
): boolean {
  if (activeMission) return false;
  if (completedMissions.includes(missionId)) return false;
  return true;
}

/**
 * Draw mission progress indicator on canvas.
 */
export function drawMissionIndicator(
  ctx: CanvasRenderingContext2D,
  activeMission: ActiveMission | null,
  cameraX: number,
  cameraY: number,
  districtCenters: Record<string, { x: number; y: number }>,
  time: number
): void {
  if (!activeMission) return;

  const center = districtCenters[activeMission.districtId];
  if (!center) return;

  const x = Math.round(center.x - cameraX);
  const y = Math.round(center.y - cameraY - 180);

  // Mission progress bar
  const totalSteps = activeMission.stepStates.length;
  const completedSteps = activeMission.stepStates.filter((s) => s === "completed").length;
  const barWidth = 80;
  const barHeight = 6;

  ctx.save();

  // Background
  const bgWidth = barWidth + 24;
  ctx.fillStyle = "rgba(8, 16, 25, 0.85)";
  ctx.fillRect(x - bgWidth / 2, y - 16, bgWidth, 28);
  ctx.strokeStyle = "rgba(51, 245, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - bgWidth / 2, y - 16, bgWidth, 28);

  // Label
  ctx.fillStyle = "#33F5FF";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  const pulse = 0.7 + Math.sin(time / 300) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText("MISSION", x, y - 6);
  ctx.globalAlpha = 1;

  // Progress segments
  const segWidth = barWidth / totalSteps;
  for (let i = 0; i < totalSteps; i++) {
    const segX = x - barWidth / 2 + i * segWidth + 1;
    const state = activeMission.stepStates[i];
    const fill =
      state === "completed"
        ? "#33F5FF"
        : state === "active"
          ? `rgba(51, 245, 255, ${0.3 + Math.sin(time / 200) * 0.2})`
          : "rgba(51, 245, 255, 0.08)";
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(segX), y + 2, Math.round(segWidth - 2), barHeight);
  }

  // Step label
  ctx.fillStyle = "#F6FBFF";
  ctx.font = "bold 6px monospace";
  ctx.fillText(`${completedSteps}/${totalSteps}`, x, y + 14);

  ctx.restore();
}
