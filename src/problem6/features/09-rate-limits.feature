@US-09 @phase-5 @security
Feature: US-09 Scripts cannot flood the service
  As the operator
  I want each player and IP address to be rate limited
  So that bots cannot farm points or overload the servers

  Background:
    Given alice is logged in

  Scenario: Too many requests from one player are slowed down
    When alice calls "POST /actions" 31 times within a minute
    Then the 31st response status is 429
    And the error code is "RATE_LIMITED"
    And the response has a "Retry-After" header

  Scenario: Too many requests from one IP are slowed down
    Given 3 players are logged in from the same IP
    When they call "POST /actions" 61 times in total within a minute
    Then the 61st response status is 429
    And the error code is "RATE_LIMITED"

  Scenario: Anyone can read the top 10 without logging in, within a generous limit
    Given an anonymous visitor with no session cookie
    When the visitor calls "GET /scoreboard" 300 times within a minute
    Then every response status is 200
    When the visitor calls "GET /scoreboard" once more
    Then the response status is 429
    And the error code is "RATE_LIMITED"
    And the response has a "Retry-After" header
