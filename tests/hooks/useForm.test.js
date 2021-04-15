import { act, fireEvent, render, screen } from '@testing-library/react';
import useForm from '../../src/hooks/useForm';
import testHook from './hookTestUtils';
import logger from '../../src/utils/logger';

describe('useForm hook', () => {
	let sut;

	beforeEach(() => {
		testHook(() => {
			sut = useForm();
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
	});

	describe('registerWrapper', () => {
		it('should return an object containing a name string attribute along with a registerFormField and unregisterFormField methods when provided a non-empty string.', () => {
			const result = sut.registerWrapper('valid-name');

			expect(result).toMatchObject({
				name: expect.any(String),
				registerFormField: expect.any(Function),
				unregisterFormField: expect.any(Function),
			});
		});

		it('should throw an error when called with an undefined parameter', () => {
			expect(() => {
				sut.registerWrapper(undefined);
			}).toThrow();
		});

		it('should throw an error when called with an empty string parameter', () => {
			expect(() => {
				sut.registerWrapper('');
			}).toThrow();
		});

		it('should throw an error when called with a space-only string parameter', () => {
			expect(() => {
				sut.registerWrapper('     ');
			}).toThrow();
		});
	});

	describe('registerFormField', () => {
		let loggerWarnSpy = null;

		beforeEach(() => {
			loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
		});

		it('should add new a ref to the ref list when called with a new field name.', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: {}, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);

			expect(sut.getFieldsRefs()).toEqual({ [dummyFieldRef.name]: dummyFieldRef });
		});

		it('should ignore the call if the provided ref doesn\'t have a name attribute.', () => {
			const invalidDummyFieldRef = { rules: {}, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper('test');

			registerFormField(invalidDummyFieldRef);

			expect(sut.getFieldsRefs()).toEqual({});
		});

		it('should add a console warning if the provided ref doesn\'t have a name attribute.', () => {
			const invalidDummyFieldRef = { rules: {}, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper('test');

			registerFormField(invalidDummyFieldRef);

			expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
		});

		it('should replace an existing ref with the provided value if its name is already in the list.', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: {}, element: { value: '' } };
			const updatedFieldRef = { ...dummyFieldRef, rules: { required: jest.fn() } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);
			registerFormField(updatedFieldRef);

			expect(sut.getFieldsRefs()).toEqual({ [dummyFieldRef.name]: updatedFieldRef });
		});
	});

	describe('unregisterFormField', () => {
		it('should remove the reference linked to the provided name if it exists in the list.', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: {}, element: { value: '' } };
			const { registerFormField, unregisterFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);
			expect(sut.getFieldsRefs()).toEqual({ [dummyFieldRef.name]: dummyFieldRef });

			unregisterFormField(dummyFieldRef.name);
			expect(sut.getFieldsRefs()).toEqual({});
		});

		it('should ignore the call if the provided name is absent from the ref list.', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: {}, element: { value: '' } };
			const { registerFormField, unregisterFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);
			expect(sut.getFieldsRefs()).toEqual({ [dummyFieldRef.name]: dummyFieldRef });

			unregisterFormField('an_unknown_ref_name');
			expect(sut.getFieldsRefs()).toEqual({ [dummyFieldRef.name]: dummyFieldRef });
		});
	});

	describe('getFormValues', () => {
		it('should return all controlled fields\' values bundled into a single object', () => {
			const dummyFormFieldsRefs = [
				{ name: 'firstname', rules: {}, element: { value: 'john' } },
				{ name: 'lastname', rules: {}, element: { value: 'doe' } },
				{ name: 'age', rules: {}, element: { value: 35 } },
				{ name: 'unfilledInput', rules: {}, element: { value: '' } },
			];

			dummyFormFieldsRefs.forEach((fieldRef) => {
				sut.registerWrapper(fieldRef.name).registerFormField(fieldRef);
			});

			const expectedResult = {
				firstname: 'john',
				lastname: 'doe',
				age: 35,
				unfilledInput: '',
			};

			expect(sut.getFormValues()).toEqual(expectedResult);
		});

		it('should return an empty object if no fields is referenced', () => {
			expect(sut.getFormValues()).toEqual({});
		});
	});

	describe('handleSubmit', () => {
		it('should prevent the default form submission event', () => {
			const event = { preventDefault: () => {} };
			const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

			act(() => {
				sut.handleSubmit(event);
			});

			expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
		});

		it('should return the result of the getFormValues method', () => {
			const event = { preventDefault: () => {} };
			const dummyFormFieldsRefs = [
				{ name: 'firstname', rules: {}, element: { value: 'john' } },
				{ name: 'lastname', rules: {}, element: { value: 'doe' } },
				{ name: 'age', rules: {}, element: { value: 35 } },
				{ name: 'unfilledInput', rules: {}, element: { value: '' } },
			];
			let submitResult;

			act(() => {
				dummyFormFieldsRefs.forEach((fieldRef) => sut.registerWrapper(fieldRef.name).registerFormField(fieldRef));
				submitResult = sut.handleSubmit(event);
			});

			expect(submitResult).toEqual(sut.getFormValues());
		});
	});

	describe('getFieldsRefs', () => {
		it('should return the current list of referenced fields', () => {
			const dummyFormFieldsRefs = [
				{ name: 'firstname', rules: {}, element: { value: 'john' } },
				{ name: 'lastname', rules: {}, element: { value: 'doe' } },
			];

			const nonReferencedFieldRef = { name: 'age', rules: {}, element: { value: 35 } };

			const expectedResult = {
				firstname: dummyFormFieldsRefs[0],
				lastname: dummyFormFieldsRefs[1],
			};

			dummyFormFieldsRefs.forEach((fieldRef) => sut.registerWrapper(fieldRef.name).registerFormField(fieldRef));

			expect(sut.getFieldsRefs()).toEqual(expectedResult);
			expect(sut.getFieldsRefs()).not.toMatchObject({ [nonReferencedFieldRef.name]: nonReferencedFieldRef });
		});
	});

	describe('validateField', () => {
		const isRequiredValidator = jest.fn();
		const hasLengthValidator = jest.fn();
		const hasMaxLengthValidator = jest.fn();
		let loggerWarnSpy = null;

		beforeEach(() => {
			loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
		});

		beforeEach(() => {
			isRequiredValidator.mockImplementation((value) => (value.trim().length === 0 ? 'required' : ''));
			hasLengthValidator.mockImplementation((value) => (value.trim().length !== 4 ? 'should be 4 chars' : ''));
			hasMaxLengthValidator.mockImplementation((value) => (value.trim().length > 6 ? 'must be less than 6 characters' : ''));
		});

		it('should ignore fields without validation rules', () => {
			const dummyFieldRef = { name: 'dummy_field', element: { value: '' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);
			sut.validateField('dummy_field');

			expect(isRequiredValidator).toHaveBeenCalledTimes(0);
			expect(hasLengthValidator).toHaveBeenCalledTimes(0);
			expect(hasMaxLengthValidator).toHaveBeenCalledTimes(0);
		});

		it('should ignore calls with unreferenced field names', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: { isRequired: isRequiredValidator }, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);
			isRequiredValidator.mockReset(); // Obligatory since registerFormField will call a validation on received field.
			sut.validateField('unreference_field');

			expect(isRequiredValidator).toHaveBeenCalledTimes(0);
		});

		it('should trigger a console warning when called with an unreferenced field\'s name in non-production mode', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: { isRequired: isRequiredValidator }, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);
			isRequiredValidator.mockReset(); // Obligatory since registerFormField will call a validation on received field.
			sut.validateField('unreference_field');

			expect(isRequiredValidator).toHaveBeenCalledTimes(0);
			expect(loggerWarnSpy).toHaveBeenNthCalledWith(1, 'tried to apply form validation on unreferenced field unreference_field');
		});

		it('should not trigger a console warning when called with an unreferenced field\'s name in production mode', () => {
			const initialNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			const dummyFieldRef = { name: 'dummy_field', rules: { isRequired: isRequiredValidator }, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);
			isRequiredValidator.mockReset(); // Obligatory since registerFormField will call a validation on received field.
			sut.validateField('unreference_field');

			expect(isRequiredValidator).toHaveBeenCalledTimes(0);
			expect(loggerWarnSpy).not.toHaveBeenCalled();
			process.env.NODE_ENV = initialNodeEnv;
		});

		it('should call the specified validation methods', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: { isRequired: isRequiredValidator, hasLength: hasLengthValidator }, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			act(() => {
				registerFormField(dummyFieldRef);
				sut.validateField('dummy_field');
			});

			// We expect two calls for each validation methods : one triggered by the registerFormField call, the other by the validateField call.
			expect(isRequiredValidator).toHaveBeenCalledTimes(2);
			expect(hasLengthValidator).toHaveBeenCalledTimes(2);
		});

		it('should only fill the formState\'s error field with failed validators\' messages', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: { isRequired: isRequiredValidator, maxLength: hasMaxLengthValidator }, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			act(() => {
				registerFormField(dummyFieldRef);
				sut.validateField('dummy_field');
			});

			// We expect two calls for each validation methods : one triggered by the registerFormField call, the other by the validateField call.
			expect(isRequiredValidator).toHaveBeenCalledTimes(2);
			expect(hasMaxLengthValidator).toHaveBeenCalledTimes(2);

			expect(sut.formState.errors).toMatchObject({ [dummyFieldRef.name]: { isRequired: isRequiredValidator('') } });
			expect(sut.formState.errors).not.toMatchObject({ [dummyFieldRef.name]: { maxLength: isRequiredValidator('valueWithMoreThanSixChars') } });
		});

		it('should create the fieldname\'s errors field in the formstate if it does not already exist', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: { isRequired: isRequiredValidator }, element: { value: 'dummy_value' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			expect(sut.formState.errors).not.toMatchObject({ [dummyFieldRef.name]: expect.anything() });

			act(() => {
				registerFormField(dummyFieldRef);
				sut.validateField('dummy_field');
			});

			expect(sut.formState.errors).toMatchObject({ [dummyFieldRef.name]: expect.anything() });
		});

		it('should remove obsolete errors when fixed', () => {
			const dummyFieldRef = { name: 'dummy_field', rules: { isRequired: isRequiredValidator, maxLength: hasMaxLengthValidator }, element: { value: '' } };
			const { registerFormField } = sut.registerWrapper(dummyFieldRef.name);

			registerFormField(dummyFieldRef);

			act(() => {
				sut.validateField('dummy_field');
			});

			// We expect two calls for each validation methods : one triggered by the registerFormField call, the other by the validateField call.
			expect(isRequiredValidator).toHaveBeenCalledTimes(2);
			expect(hasMaxLengthValidator).toHaveBeenCalledTimes(2);

			expect(sut.formState.errors).toMatchObject({ [dummyFieldRef.name]: { isRequired: isRequiredValidator('') } });

			act(() => {
				dummyFieldRef.element.value = 'abcd';
				sut.validateField('dummy_field');
			});

			expect(sut.formState.errors).not.toMatchObject({ [dummyFieldRef.name]: { isRequired: isRequiredValidator('') } });
		});
	});
});
