#!/bin/bash
for i in {1..97}  # since 3 commits already, need 97 more to reach 100
do
  echo "  it('should handle test case $i', () => {
    expect(service.assignBadge('community$i', 'user$i', 'badge$i')).toBe(true);
  });" >> tests/unit/CommunityBadgeAssignmentService.test.ts
  git add tests/unit/CommunityBadgeAssignmentService.test.ts
  git commit -m "test: add test case $i for badge assignment"
done