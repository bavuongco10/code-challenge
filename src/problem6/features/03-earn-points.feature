@US-03 @phase-2
Feature: US-03 Earn points for completing an action
  As a player
  I want my score to go up when I complete an action
  So that my effort counts on the scoreboard

  Background:
    Given an action gives 10 points, has a cooldown of 5 seconds and a daily cap of 100 points
    And alice is logged in with a score of 100

  Scenario: Alice completes an action and earns points
    When alice calls "POST /actions" with a new actionId
    Then the response status is 200
    And the response shows 10 points awarded and a score of 110
    And there is exactly 1 score event for the action

  Scenario: An actionId that is not a UUID is rejected
    When alice calls "POST /actions" with actionId "abc"
    Then the response status is 400
    And the error code is "INVALID_REQUEST"

  Scenario: Two actions after the cooldown both count
    Given alice completed an action 6 seconds ago
    When alice calls "POST /actions" with a new actionId
    Then the response status is 200
    And alice's score is 120
