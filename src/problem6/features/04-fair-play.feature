@US-04 @phase-2 @security
Feature: US-04 Nobody can raise a score without earning it
  As a player
  I want cheaters to be unable to inflate their scores
  So that the scoreboard is fair

  Background:
    Given an action gives 10 points, has a cooldown of 5 seconds and a daily cap of 100 points
    And these users exist:
      | displayName | role | status |
      | alice       | user | active |
      | bob         | user | active |
    And alice is logged in with a score of 100

  Scenario: The client cannot choose how many points it gets
    When alice calls "POST /actions" with a new actionId and the extra body field "points" set to 1000
    Then the response shows 10 points awarded and a score of 110

  Scenario: Acting again within the cooldown is rejected, and stays rejected
    Given alice completed an action 2 seconds ago
    When alice calls "POST /actions" with a new actionId
    Then the response status is 429
    And the error code is "TOO_FAST"
    And the response has a "Retry-After" header
    When 10 more seconds pass and alice retries with the same actionId
    Then the response status is 429
    And the error code is "TOO_FAST"
    And alice's score is 110

  Scenario: Replaying a completed action does not award points twice
    Given alice has completed an action and received a score of 110
    When alice sends the same actionId again
    Then the response status is 200
    And the response is identical to the first one
    And alice's score is 110

  Scenario: Reusing another player's actionId does not touch their score
    Given alice has completed an action
    And bob is logged in with a score of 50
    When bob sends alice's actionId
    Then bob's score is 60
    And alice's score is 110

  Scenario: Many parallel requests with one actionId award points once
    When alice sends 50 requests with the same actionId at the same time
    Then alice's score is 110
    And there is exactly 1 score event for the action
    And every response is either 200 or 409 "ACTION_IN_PROGRESS"

  Scenario: Parallel requests with different actionIds cannot skip the cooldown
    When alice sends 20 requests with different actionIds at the same time
    Then exactly 1 request succeeds
    And the other 19 get status 429 with error code "TOO_FAST"
    And alice's score is 110

  Scenario: The daily cap holds
    Given alice has already earned 100 points from actions today
    When alice calls "POST /actions" with a new actionId
    Then the response status is 429
    And the error code is "DAILY_CAP"
    And alice's score is unchanged
