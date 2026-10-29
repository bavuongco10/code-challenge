@extra @phase-1 @security
Feature: My session cannot be misused
  As a player
  I want my session to be rejected when it is missing, forged, stale or used from another site
  So that nobody can earn points in my name

  Background:
    Given these users exist:
      | displayName | role | status |
      | alice       | user | active |

  Scenario Outline: A request with a bad session is rejected
    Given alice's session cookie is <problem>
    When alice calls "POST /actions"
    Then the response status is 401
    And the error code is "UNAUTHENTICATED"

    Examples:
      | problem                         |
      | missing                         |
      | tampered with                   |
      | expired                         |
      | for a session she logged out of |

  Scenario: A request from a foreign site is rejected
    Given alice is logged in
    When alice calls "POST /actions" with Origin "https://evil.example"
    Then the response status is 403
    And the error code is "FORBIDDEN"

  Scenario: An idle session expires
    Given alice is logged in
    When alice makes no request for 31 minutes
    And alice calls "POST /actions"
    Then the response status is 401

  Scenario: A session ends 12 hours after login even if active
    Given alice logged in 12 hours ago and has been active since
    When alice calls "POST /actions"
    Then the response status is 401

  Scenario: A banned user is rejected even if a session survived
    Given alice is logged in
    And alice is in the banned users list but her session was not deleted
    When alice calls "POST /actions"
    Then the response status is 403
    And the error code is "FORBIDDEN"
