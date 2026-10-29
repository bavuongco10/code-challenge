@US-01 @phase-2
Feature: US-01 Earn points for completing an action
  As a player
  I want my score to go up when I really complete an action
  So that my effort counts on the scoreboard

  Background:
    Given an action gives 10 points, a minimum duration of 3 seconds, a cooldown of 5 seconds and a daily cap of 100 points
    And alice is logged in with a score of 100

  Scenario: Alice starts and finishes an action and earns points
    Given alice calls "POST /actions/start" and gets a token
    And the action service recorded alice's run for that token as finished 4 seconds later
    When alice calls "POST /actions" with the token and the run's proof
    Then the response status is 200
    And the response shows 10 points awarded and a score of 110
    And there is exactly 1 score event for the action

  Scenario: A lost reply can be retried safely, even after Redis loses the record
    Given alice has completed an action but the reply was lost
    And the Redis record for the token is gone
    When alice retries with the same token
    Then the response status is 200
    And alice's score is 110
    And there is exactly 1 score event for the action

  Scenario: The database is down, then recovers
    Given alice has a finished run for her token
    And Postgres is unavailable
    When alice calls "POST /actions" with the token
    Then the response status is 503
    When Postgres becomes available and alice retries with the same token
    Then the response status is 200
    And alice's score is 110

  Scenario: The daily cap holds
    Given alice has already earned 100 points from actions today
    When alice completes another action with a valid token and proof
    Then the response status is 429
    And the error code is "DAILY_CAP"
    And the response has a "Retry-After" header
