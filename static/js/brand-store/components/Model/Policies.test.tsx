import React from "react";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import Policies from "./Policies";

let mockFilterQuery = "1.7";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
  };
});

function renderComponent() {
  return render(
    <RecoilRoot>
      <BrowserRouter>
        <Policies />
      </BrowserRouter>
    </RecoilRoot>
  );
}

describe("Policies", () => {
  it("displays a link to create a new policy", () => {
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Create policy" })
    ).toBeInTheDocument();
  });

  it("shows a create policy form when 'Create new policy' button clicked", () => {
    const user = userEvent.setup();
    renderComponent();
    user.click(screen.getByRole("link", { name: "Create policy" }));
    expect(
      screen.getByRole("combobox", { name: "Signing key" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add policy" })
    ).toBeInTheDocument();
  });

  it("displays a filter input", () => {
    renderComponent();
    expect(screen.getByLabelText("Search policies")).toBeInTheDocument();
  });

  it("populates filter with the filter query parameter", () => {
    renderComponent();
    expect(screen.getByLabelText("Search policies")).toHaveValue(
      mockFilterQuery
    );
  });

  it("displays a table of policies", () => {
    renderComponent();
    expect(screen.getByTestId("policies-table")).toBeInTheDocument();
  });
});