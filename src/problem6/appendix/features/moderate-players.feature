@extra @phase-5 @security
Feature: Moderate cheaters
  As an admin
  I want to flag, ban and correct the scores of cheaters
  So that the scoreboard stays trustworthy

  Background:
    Given these users exist:
      | displayName | role  | status |
      | alice       | user  | active |
      | bob         | user  | active |
      | carol       | admin | active |

  Scenario: A normal user cannot use admin endpoints
    Given alice is logged in
    When alice calls "POST /admin/users/{bob}/flag"
    Then the response status is 403
    And the error code is "FORBIDDEN"

  Scenario: An admin must have logged in with a passkey in the last 5 minutes
    Given carol logged in with a passkey 10 minutes ago
    When carol calls "POST /admin/users/{bob}/flag"
    Then the response status is 403
    And the error code is "REAUTH_REQUIRED"

  Scenario: Banning a user takes effect immediately
    Given carol logged in with a passkey 1 minute ago
    And bob is logged in on 2 devices and is in the top 10
    When carol bans bob
    Then both of bob's sessions get 401 or 403 on their next request
    And bob is not in "GET /scoreboard"

  Scenario: An admin lowers a score and the top 10 updates
    Given carol logged in with a passkey 1 minute ago
    And bob is in the top 10 with a score of 900
    And a viewer is connected to the stream
    When carol adjusts bob's score by -500 with reason "cheating"
    Then bob's score is 400
    And a score event with reason "admin" and delta -500 is recorded
    And the viewer receives an updated top 10
