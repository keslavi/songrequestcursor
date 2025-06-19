import { Formhelper } from "./test/formhelper";
import { SelectMulti } from "./select-multi";

//note, not using mock here, but rather a formhelpertest component that uses the multiselect component.
// this is a good way to test the component in a more realistic scenario.
// also allows user to directly bench test.

describe("Formhelper-Multiselect", () => {
  const testData = () => {
    return {
      item: {
        names2: [1, 2],
      },
      options: {
        task: {
          names: [
            { key: 1, text: "aaa1" },
            { key: 2, text: "bbb2" },
            { key: 3, text: "ccc3" },
          ],
        },
      },
    };
  };
    
  it("loads correctly", () => {
    const data=testData();
    console.log("Formhelper-Multiselect test started", (new Date()).toLocaleTimeString() );
    render(
      <Formhelper
        item={data.item}
        option={data.options}
      >
        <SelectMulti
          name="names2"
          label="Names2 (multiselect)"
          optionsMulti={data.options.task.names}
          data-testid="multiselect"
        />
      </Formhelper>
    );
    expect(screen.getByText(/formhelper tester/i)).toBeVisible();
    //gmagig gigexpect(screen.getByText(/Names2 \(multiselect\)/i)).toBeVisible();
    expect(screen.getByText(/aaa1/i)).toBeVisible();
  });
});