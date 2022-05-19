/* eslint-disable curly */
/* eslint-disable no-constant-condition */
/* eslint-disable no-undef */
/* eslint-disable brace-style */
// eslint-disable-next-line spaced-comment
/// <reference types="Cypress" />
before(() => {
  cy.visit("localhost:30000");
  cy.wait(1000);
  cy.get("body").then((body) => {
    if (body.find("form#setup-configuration").length > 0) {
      if (body.find(".package[data-package-id='magnolia-test'").length === 0) {
        cy.get("#create-world").click();
        cy.wait(1000);
        cy.get('input[name="title"]').type("Magnolia Test");
        cy.get('select[name="system"]').select("Project Magnolia (test)").should("have.value", "ard20");
        cy.get('button[title="Create World]').click();
        cy.wait(200);
      }
      cy.get("#world-list > .package[data-package-id='magnolia-test'");
      cy.get('[data-package-id="magnolia-test"] > .package-controls > [name="action"]').click();
      cy.wait(1000);
    }
    cy.get('select[name="userid"]').select("Gamemaster");
    cy.get('button[name="join"]').click();
    cy.wait(2000);
    cy.get("#logo").should("be.visible");
  });
});

describe("open my formula advancem settings", () => {
  it("check setting button", () => {
    cy.get("nav#sidebar-tabs > [data-tab='settings']").click();
    cy.wait(150);
    cy.get("#settings-game > button[data-action='modules']")
      .click()
      .then((check) => {
        if (check) {
          cy.get("div#module-management");
          cy.get("div#module-management [data-module-name='typhonjs'] input[type='checkbox']").should(
            "have.attr",
            "checked"
          );
        }
      });
    cy.wait(150);
    const click = ($el) => $el.click();
    cy.get("div#module-management a.header-button.close")
      .pipe(click)
      .should(($el) => {
        expect($el).to.not.be.visible;
      });
    /* cy.get("div#module-management a.header-button.close")
      .trigger("mouseover")
      .click({ waitForAnimations: true, force: true });*/
    cy.get("#settings-game > button[data-action='configure']")
      .click()
      .then((check) => {
        if (check) {
          cy.get("div#client-settings a[data-tab='system']").trigger("click");
          cy.get("div#client-settings a[data-tab='system']").trigger("mouseover").click();
        }
      });
  });
});
