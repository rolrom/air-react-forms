import { mount } from 'enzyme';

/**
 * @name TestHook
 * @description An component calling the callback in parameter allowing us to test hooks.
 */
const TestHook = ({ callback }) => {
	callback();

	return null;
};

/**
 * @function
 * @name testHook
 * @description A method used to mount the TestHook component and providing it with our hook as callback.
 *
 * @param {*} hookUnderTest
 */
const testHook = (hookUnderTest) => {
	mount(<TestHook callback={hookUnderTest} />);
};

export default testHook;
