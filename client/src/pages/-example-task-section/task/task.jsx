import { useEffect } from "react";
import { isEmpty } from "lodash";
import { toast } from "react-toastify";
import { useNavigate, /*NavLink,*/ useParams } from "react-router-dom";
import { store } from "store";

//prettier-ignore
import {
  Col,
  FormProvider,
  useFormProvider,
  Input,
  Row,
  //TextareaDebug,  
  Fieldset,
  BtnContinueSave,
} from "components";

//prettier-ignore
import {
  resolver,
} from "./validation";

export const Task = () => {
  const item = store.use.task();
  const taskRetrieve = store.use.taskRetrieve();
  const taskUpsert = store.use.taskUpsert();
  const option = store.use.option();
  const { id } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    taskRetrieve(id);
  }, []);

  // Get form methods for use outside the form
  const formMethods = useFormProvider({
    resolver,
    defaultValues: item,
    //mode:"onChange"
  });
  const { reset } = formMethods;

  useEffect(() => {
    if (!isEmpty(item)) {
      reset(item);
    }
  }, [item]);

  // DO NOT SUBMIT HERE; it's done in BtnContinueSave
  const onClickContinueSave = (e) => {
    const id = e.currentTarget.id;
    switch (id) {
      case "btnContinue":
        //alert("btnContinueSave. additional logic here if needed");
        e.currentTarget.form.requestSubmit();
        break;
      case "btnSave":
        alert("btnSave. additional logic here if needed");
        break;
      default:
        toast.error(`onClickContinueSave: unknown id: ${id}`);
    }
  }

  const onSubmit = (values) => {
    //note:  values can't get here prior to form & business validation
    toast.info(
      <div>
        Submit clicked
        <br />
        <textarea
          rows={5}
          cols={30}
          defaultValue={JSON.stringify(values, null, 2)}
        ></textarea>
      </div>
    );
    taskUpsert(values);
  };

  const onDelete = () => {
    const values = { ...item };
    //actTask_D(values);
    navigate("/dev/tasks");
  };

  const onCancel = () => {
    //actTask_Clear();
    navigate("/dev/tasks");
  };

  if (isEmpty(item) || isEmpty(option)) return <div>loading...</div>;
  return (
    <>
      <Row>
        <Col size={12}>
          <h2>Task</h2>
        </Col>
      </Row>
      <FormProvider 
        onSubmit={onSubmit}
        formMethods={formMethods}
      >
        <BtnContinueSave
          onClickContinueSave={onClickContinueSave}
        />
        <div className="hidden">
          <Row>
            <div className="hidden"> Col is INSIDE Input</div>
            <Input name="id" />
          </Row>
        </div>
        <Fieldset>
          <Row>
            <div className="hidden"> Col is INSIDE Input</div>
            <Input
              //size={{xs:6,xm:7}} //size={4} muiv6 Grid2 uses size
              name="subject"
              label="Subject"
              info="header|body"
              //info={<font color='red'>object support</font>}
            />
            <Input name="body" label="Body" />
          </Row>
        </Fieldset>            
        <br />
        <Fieldset>
          <Row>
            <Input
              name="names"
              label="Names"
              optionscheckbox={
                option.task.status /*["steve","cindy", "riley", "whatever"]*/
              }
            />
          </Row>

          <Row>
            <Input name="status" label="Status" options={option.task.status} info="header2|body2" />
            {/* <Select name="status" label="Status" options={option.status} /> */}
            <Input name="result" label="Result" options={option.task.result} />
            <Input datepicker name="dfrom" label="From" />
          </Row>
        </Fieldset>
        <br />
        <Fieldset>
          <Row>
            <Input name="address.line1" label="address" />
          </Row>
          <Row>
            <Input name="address.line2" />
          </Row>
          <Row>
            <Input name="address.line3" />
          </Row>
        </Fieldset>
      </FormProvider>
      {/* <TextareaDebug value={{ item, option }} /> */}
    </>
  );
};
export default Task;
