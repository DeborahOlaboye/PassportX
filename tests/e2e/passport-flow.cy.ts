describe('PassportX E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('User Passport Flow', () => {
    it('should create and view passport', () => {
      // Connect wallet
      cy.get('[data-testid="connect-wallet"]').click();
      cy.get('[data-testid="wallet-option-hiro"]').click();
      
      // Create passport
      cy.get('[data-testid="create-passport"]').click();
      cy.get('[data-testid="passport-name"]').type('Test User');
      cy.get('[data-testid="submit-passport"]').click();
      
      // Verify passport created
      cy.url().should('include', '/passport');
      cy.get('[data-testid="passport-title"]').should('contain', 'Test User');
      cy.get('[data-testid="badge-count"]').should('contain', '0 badges');
    });

    it('should display badges in passport', () => {
      // Mock user with badges
      cy.intercept('GET', '/api/user/badges', {
        fixture: 'user-badges.json'
      });
      
      cy.visit('/passport/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      
      // Verify badges displayed
      cy.get('[data-testid="badge-grid"]').should('be.visible');
      cy.get('[data-testid="badge-card"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="badge-card"]').first().should('contain', 'Python Beginner');
    });
  });

  describe('Community Management Flow', () => {
    it('should create community and issue badges', () => {
      // Login as admin
      cy.get('[data-testid="connect-wallet"]').click();
      cy.get('[data-testid="wallet-option-hiro"]').click();
      
      // Navigate to communities
      cy.get('[data-testid="nav-communities"]').click();
      
      // Create community
      cy.get('[data-testid="create-community"]').click();
      cy.get('[data-testid="community-name"]').type('Test Community');
      cy.get('[data-testid="community-description"]').type('A test community');
      cy.get('[data-testid="submit-community"]').click();
      
      // Verify community created
      cy.get('[data-testid="community-card"]').should('contain', 'Test Community');
      
      // Create badge template
      cy.get('[data-testid="community-card"]').click();
      cy.get('[data-testid="create-template"]').click();
      cy.get('[data-testid="template-name"]').type('Test Badge');
      cy.get('[data-testid="template-description"]').type('A test badge');
      cy.get('[data-testid="template-category"]').select('skill');
      cy.get('[data-testid="submit-template"]').click();
      
      // Issue badge
      cy.get('[data-testid="issue-badge"]').click();
      cy.get('[data-testid="recipient-address"]').type('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      cy.get('[data-testid="badge-template"]').select('Test Badge');
      cy.get('[data-testid="mint-badge"]').click();
      
      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Badge issued successfully');
    });
  });

  describe('Badge Discovery Flow', () => {
    it('should browse and filter badges', () => {
      cy.visit('/discover');
      
      // Filter by category
      cy.get('[data-testid="filter-category"]').select('skill');
      cy.get('[data-testid="badge-results"]').should('be.visible');
      
      // Search badges
      cy.get('[data-testid="search-input"]').type('Python');
      cy.get('[data-testid="search-button"]').click();
      cy.get('[data-testid="badge-results"]').should('contain', 'Python');
      
      // View badge details
      cy.get('[data-testid="badge-card"]').first().click();
      cy.get('[data-testid="badge-modal"]').should('be.visible');
      cy.get('[data-testid="badge-description"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      // Check mobile navigation
      cy.get('[data-testid="mobile-menu"]').click();
      cy.get('[data-testid="nav-menu"]').should('be.visible');
      
      // Check passport view on mobile
      cy.visit('/passport/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      cy.get('[data-testid="badge-grid"]').should('be.visible');
      cy.get('[data-testid="badge-card"]').should('have.css', 'width');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('GET', '/api/user/badges', { forceNetworkError: true });
      
      cy.visit('/passport/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      
      // Verify error message
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load badges');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle invalid addresses', () => {
      cy.visit('/passport/invalid-address');
      
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid address');
      cy.get('[data-testid="back-button"]').should('be.visible');
    });
  });
});