$ = require("jquery")
days = require("../../build/js/sample.js")
complimentTemplate = require("../../build/compiled_templates/compliment.js")
helloTemplate = require("../../build/compiled_templates/hello.js")
daysTemplate = require("../../build/compiled_templates/days.js")

$ ->
  $("#hello").html helloTemplate(name: "Dave")
  $("#compliment").html complimentTemplate(compliment: "You're great!")
  $("#days").html daysTemplate(days: days())
