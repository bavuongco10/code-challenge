@extra @phase-3
Feature: See the top 10
  As a visitor
  I want to see the 10 highest scores
  So that I know who is leading

  Scenario: A visitor sees the top 10
    Given 12 unflagged players have scores
    When an anonymous visitor calls "GET /scoreboard"
    Then the response lists the 10 highest scores in descending order
    And each entry has a rank, a display name and a score
    And no entry contains an internal user ID

  Scenario: Equal scores are always shown in the same order
    Given alice and bob both have a score of 500
    When an anonymous visitor calls "GET /scoreboard" twice
    Then alice and bob appear in the same order both times

  Scenario: Flagged players are hidden
    Given bob is in the top 10
    When bob is flagged
    Then bob is not in "GET /scoreboard"

  @security
  Scenario: A flagged player who keeps playing stays hidden
    Given bob is flagged
    And bob completes an action
    When an anonymous visitor calls "GET /scoreboard"
    Then bob is not in the response

  Scenario: The scoreboard survives losing the Redis data
    Given 12 players have scores
    And the current top 10 has been recorded
    When all Redis data is lost and the rebuild job runs
    Then "GET /scoreboard" shows the same top 10 as before

  Scenario: The scoreboard is served while Redis is down
    Given Redis is unavailable
    When an anonymous visitor calls "GET /scoreboard"
    Then the response status is 200
    And the top 10 is read from Postgres
