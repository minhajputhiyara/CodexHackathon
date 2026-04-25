import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { message, files } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Commit message is required" },
        { status: 400 }
      );
    }

    // Add files
    if (files && files.length > 0) {
      for (const file of files) {
        await execAsync(`git add "${file}"`);
      }
    } else {
      // Add all changes
      await execAsync("git add .");
    }

    // Commit
    await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Git commit error:", error);
    return NextResponse.json(
      { error: "Failed to commit changes" },
      { status: 500 }
    );
  }
}
