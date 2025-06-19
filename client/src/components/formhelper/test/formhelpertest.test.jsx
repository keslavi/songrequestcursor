import { Formhelper } from "./formhelper";

it("renders without crashing", () => {
  render(<Formhelper />);
  expect(screen.getByText(/formhelper tester/i)).toBeVisible(); 
});
