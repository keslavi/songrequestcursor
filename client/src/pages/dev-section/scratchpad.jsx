export const Scratchpad = () => {
  return (
    <div>
      <h4>Scratchpad</h4>
      
      <h5>VITE_GRR specifically:</h5>
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0', margin: '10px 0' }}>
        {import.meta.env.VITE_GRR || 'undefined'}
      </div>
      
      <h5>All VITE_ environment variables:</h5>
      <textarea 
        rows={15} 
        cols={100} 
        readOnly 
        defaultValue={JSON.stringify(import.meta.env, null, 2)}/>
    </div>
  )
}
export default Scratchpad;