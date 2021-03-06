Feature: I can update my slideshow after I upgrade trickster
  Since the slideshow is self-contained
  I need a way to get the latest features of trickster

  Scenario Outline: Can update a slideshow
    Given a slideshow in "test_slideshow"
    And the JS files and CSS files in "test_slideshow" are out-of-date
    When I cd to "test_slideshow"
    And I successfully run `trickster update <args>`
    Then the JS files and CSS files in "test_slideshow" should be up-to-date
    And a file named "css/theme.css" should exist
    But "css/styles.css" in "test_slideshow" should not have been touched
    And "js/custom.js" in "test_slideshow" should not have been touched
    And "css/theme.css" in "test_slideshow" should not have been touched

    Examples:
      | args  |
      |       |
      | files |

  Scenario: Can update the theme
    Given a slideshow in "test_slideshow"
    And the JS files and CSS files in "test_slideshow" are out-of-date
    When I cd to "test_slideshow"
    And I successfully run `trickster update theme`
    Then "css/theme.css" in "test_slideshow" should be identical to "default.css"

  Scenario: Can update the theme
    Given a slideshow in "test_slideshow"
    And the JS files and CSS files in "test_slideshow" are out-of-date
    When I cd to "test_slideshow"
    And I successfully run `trickster update theme -t github`
    Then "css/theme.css" in "test_slideshow" should be identical to "github.css"
