import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);

export async function POST() {
  try {
    await execAsync("git push");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Git push error:", error);
    return NextResponse.json(
      { error: "Failed to push changes" },
      { status: 500 }
    );
  }
}
