import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync("git status --porcelain");
    
    const changes = stdout
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const status = line.substring(0, 2).trim();
        const path = line.substring(3);
        
        let changeStatus: "modified" | "added" | "deleted" = "modified";
        if (status.includes("A")) changeStatus = "added";
        else if (status.includes("D")) changeStatus = "deleted";
        else if (status.includes("M")) changeStatus = "modified";
        
        return { path, status: changeStatus };
      });

    // Get current branch
    const { stdout: branchOutput } = await execAsync("git branch --show-current");
    const branch = branchOutput.trim();

    return NextResponse.json({ changes, branch });
  } catch (error) {
    console.error("Git status error:", error);
    return NextResponse.json(
      { error: "Failed to get git status" },
      { status: 500 }
    );
  }
}
