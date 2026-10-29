@US-03 @phase-4
Feature: US-03 Watch the top 10 change live
  As a visitor
  I want the scoreboard to update without refreshing the page
  So that I see the competition as it happens

  Scenario: A viewer gets the current top 10 on connect
    When a viewer opens "GET /scoreboard/stream"
    Then the viewer immediately receives a "scoreboard" event with the current top 10

  Scenario: A viewer is notified when the top 10 changes
    Given a viewer is connected to the stream
    When alice earns enough points to enter the top 10
    Then within 1 second the viewer receives an event that includes alice
    And the event's version is higher than the previous one

  Scenario: No event when a change is outside the top 10
    Given a viewer is connected to the stream
    And bob is ranked 50th
    When bob earns 10 points and is still outside the top 10
    Then the viewer receives no "scoreboard" event within 2 seconds

  Scenario: Updates reach viewers connected to other servers
    Given there are 2 API instances, A and B
    And a viewer is connected to the stream on instance B
    When alice enters the top 10 through instance A
    Then within 1 second the viewer on B receives the new top 10

  Scenario: An older score never overwrites a newer one
    Given alice's score updates of 120 and 130 reach Redis in the order 130, then 120
    Then alice's score on the scoreboard is 130

  Scenario: A renamed top-10 player shows the new name live
    Given a viewer is connected to the stream
    And alice is in the top 10
    When alice changes her display name to "alice2"
    Then the viewer receives an event showing "alice2"
