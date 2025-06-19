import '@testing-library/jest-dom'
import { expect } from 'vitest'
import * as RTL from '@testing-library/react'
import userEvent from '@testing-library/user-event'

global.expect = expect
global.screen = RTL.screen
global.render = RTL.render
global.fireEvent = RTL.fireEvent
global.within = RTL.within
global.userEvent = userEvent
global.uv=userEvent
