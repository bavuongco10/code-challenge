@extra @phase-1 @security
Feature: Log in with a passkey
  As a player
  I want to log in with a passkey
  So that nobody can steal my password and play as me

  Background:
    Given these users exist:
      | displayName | role | status |
      | alice       | user | active |

  Scenario: Alice logs in with a passkey
    Given alice has registered a passkey
    When alice logs in with her passkey
    Then she gets a session cookie that is HttpOnly, Secure and SameSite=Strict
    And the cookie expires in 30 minutes

  Scenario: Alice logs out
    Given alice is logged in
    When alice calls "POST /auth/logout"
    And alice calls "POST /actions"
    Then the response status is 401
