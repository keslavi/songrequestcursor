import { Formhelper } from "./test/formhelper";

it("loads correctly", () => {
  render(<Formhelper />);
  expect(screen.getByText(/formhelper tester/i)).toBeVisible(); 
});
