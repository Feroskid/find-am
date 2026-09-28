import { describe, expect, it } from "vitest";
import {
  communityUserId,
  communityUsername,
  moderatorCategoryScopes,
  normalizeRoleAssignments,
  normalizeRoles,
  roleLabels,
} from "./community-client";

describe("community response normalization", () => {
  it("reads object roles and their category labels", () => {
    const roles = [
      { role: "super_moderator", category: null },
      { role: "moderator", category: { slug: "jobs" } },
    ];
    expect(normalizeRoles(roles)).toEqual(["super_moderator", "moderator"]);
    expect(roleLabels(roles)).toBe("Super moderator, Moderator (jobs)");
    expect(moderatorCategoryScopes({ roles })).toEqual(["jobs"]);
  });

  it("unwraps both account lookup directions", () => {
    expect(communityUserId({ identity: { user_id: "FINDAM-1" } })).toBe("FINDAM-1");
    expect(communityUsername({ community_profile: { username: "TestTwo" } })).toBe("TestTwo");
  });

  it("keeps role identifiers and nested member names for removal", () => {
    const assignments = normalizeRoleAssignments({
      roles: [
        {
          role_id: "ROLE-1",
          user_id: "FINDAM-1",
          role: "moderator",
          category_slug: "jobs",
          member: { username: "testtwo", username_display: "TestTwo", rank: "JJC" },
        },
      ],
    });
    expect(assignments[0]).toMatchObject({
      assignmentId: "ROLE-1",
      userId: "FINDAM-1",
      username: "testtwo",
      displayName: "TestTwo",
      role: "moderator",
      categorySlug: "jobs",
    });
  });
});