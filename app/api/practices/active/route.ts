import { authErrorResponse, getCurrentUser } from "../../../../lib/auth";
import { ACTIVE_PRACTICE_HEADER, resolveActivePractice } from "../../../../lib/practice-context";

export async function GET(request: Request) {
  try {
    const context = await getCurrentUser(request);

    if (!context) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const requestedPracticeId =
      request.headers.get(ACTIVE_PRACTICE_HEADER) ??
      new URL(request.url).searchParams.get("practiceId");
    const active = await resolveActivePractice(context, requestedPracticeId);

    if (!active.practice || !active.membership) {
      return Response.json({ error: "No active practice found" }, { status: 404 });
    }

    return Response.json({
      membership: active.membership,
      practice: active.practice,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

