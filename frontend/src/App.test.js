jest.mock("axios", () => ({
	create: () => ({
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		delete: jest.fn(),
	}),
}));

import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the login screen by default", () => {
	render(<App />);
	expect(screen.getByRole("heading", { name: /login to stack overflow/i })).toBeInTheDocument();
	expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
});
