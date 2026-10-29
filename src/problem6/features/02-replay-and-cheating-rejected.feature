@US-02 @phase-2 @security
Feature: US-02 Nobody can raise a score without earning it
  As a player
  I want replays, forged actions and scripts to be rejected
  So that the scoreboard is fair

  Background:
    Given an action gives 10 points, a minimum duration of 3 seconds, a cooldown of 5 seconds and a daily cap of 100 points
    And these users exist:
      | displayName | role | status |
      | alice       | user | active |
      | bob         | user | active |
    And alice is logged in with a score of 100

  Scenario: Replaying a paid token does not award points twice
    Given alice has completed an action with a token and received a score of 110
    When alice sends the same token again
    Then the response is identical to the first one
    And alice's score is 110

  Scenario: 50 parallel requests with one token award points once
    Given alice has a token with a finished run
    When alice sends 50 requests with that token at the same time
    Then alice's score is 110
    And there is exactly 1 score event for the action
    And every response is either 200 or 409 "ACTION_IN_PROGRESS"

  Scenario Outline: A bad token is rejected
    When alice calls "POST /actions" with <token>
    Then the response status is 403
    And the error code is "<code>"
    And alice's score is 100

    Examples:
      | token                               | code          |
      | a token she made up                 | TOKEN_INVALID |
      | a token with one character changed  | TOKEN_INVALID |
      | a token that was issued to bob      | TOKEN_INVALID |
      | a token issued 11 minutes ago       | TOKEN_EXPIRED |

  Scenario: Finishing faster than humanly possible is rejected, and stays rejected
    Given alice calls "POST /actions/start" and gets a token
    When alice calls "POST /actions" with the token 1 second later
    Then the response status is 422
    And the error code is "TOO_QUICK"
    When 10 more seconds pass and alice retries with the same token
    Then the error code is "TOO_QUICK"

  Scenario Outline: An action the server did not see finish is rejected
    Given alice has a token
    And <run state>
    When alice calls "POST /actions" with the token
    Then the response status is 422
    And the error code is "PROOF_REJECTED"
    And alice's score is 100

    Examples:
      | run state                                      |
      | there is no run for the token                  |
      | the run for the token is still running         |
      | the run for the token belongs to bob           |
      | the proof's runId does not match the run       |

  Scenario: The client cannot choose how many points it gets
    When alice completes an action and adds the body field "points" set to 1000
    Then the response shows 10 points awarded and a score of 110

  Scenario: Cashing in many tokens at once cannot skip the cooldown
    Given alice holds 20 tokens, each with a finished run
    When alice sends all 20 at the same time
    Then exactly 1 request succeeds
    And the other 19 get status 429 with error code "TOO_FAST"
    And alice's score is 110
