import { CommunityBadgeAssignmentService } from '../../src/services/CommunityBadgeAssignmentService';

describe('CommunityBadgeAssignmentService', () => {
  let service: CommunityBadgeAssignmentService;

  beforeEach(() => {
    service = new CommunityBadgeAssignmentService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});