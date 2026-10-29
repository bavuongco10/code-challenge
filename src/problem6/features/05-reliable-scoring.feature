@US-05 @phase-2
Feature: US-05 My points are never lost or doubled when something fails
  As a player
  I want to safely retry when the network or a server fails
  So that I always get my points exactly once

  Background:
    Given an action gives 10 points, has a cooldown of 5 seconds and a daily cap of 100 points
    And alice is logged in with a score of 100

  Scenario: A lost reply can be retried safely
    Given the network drops the reply after the database commits
    When alice retries with the same actionId
    Then the response status is 200
    And the response shows 10 points awarded and a score of 110
    And there is exactly 1 score event for the action

  Scenario: A retry after Redis lost the action record is still counted once
    Given alice has completed an action and received a score of 110
    And Redis has been flushed
    When alice retries with the same actionId
    Then the response status is 200
    And alice's score is 110
    And there is exactly 1 score event for the action

  Scenario: The database is down, then recovers
    Given Postgres is unavailable
    When alice calls "POST /actions" with a new actionId
    Then the response status is 503
    When Postgres becomes available and alice retries with the same actionId
    Then the response status is 200
    And alice's score is 110

  Scenario: A server crash in the middle of a completion does not lock the actionId forever
    Given alice's actionId is stuck in "processing" because the server crashed
    When 31 seconds pass and alice retries with the same actionId
    Then the response status is 200
    And alice's score is 110
