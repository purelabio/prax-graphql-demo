export const Page404 = () => (
  <div className='col-center-center'>
    <h1 className='font-6'>404</h1>
    <p className='font-4'>Page Not Found</p>
    <Link to='' className='font-4'>Back to Home</Link>
  </div>
)

export const Button = ({children, ...props}) => (
  <button type='button' {...props}>
    <span className='flex-1 row-center-center'>
      {children}
    </span>
  </button>
)
