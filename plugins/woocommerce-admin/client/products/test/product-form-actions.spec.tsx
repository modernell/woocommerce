/**
 * External dependencies
 */
import { render, waitFor } from '@testing-library/react';
import { Form, FormContext } from '@woocommerce/components';
import { Product } from '@woocommerce/data';
import { recordEvent } from '@woocommerce/tracks';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { ProductFormActions } from '../product-form-actions';
import { validate } from '../product-validation';

const createProductWithStatus = jest.fn();
const updateProductWithStatus = jest.fn();
const copyProductWithStatus = jest.fn();
const deleteProductAndRedirect = jest.fn();

jest.mock( '@woocommerce/tracks', () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../use-product-helper', () => {
	return {
		useProductHelper: () => ( {
			createProductWithStatus,
			updateProductWithStatus,
			copyProductWithStatus,
			deleteProductAndRedirect,
		} ),
	};
} );

describe( 'ProductFormActions', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render the form action buttons', () => {
		const { queryByText } = render(
			<Form initialValues={ {} }>
				<ProductFormActions />
			</Form>
		);
		expect( queryByText( 'Save draft' ) ).toBeInTheDocument();
		expect( queryByText( 'Preview' ) ).toBeInTheDocument();
		expect( queryByText( 'Publish' ) ).toBeInTheDocument();
	} );

	it( 'should have a publish dropdown button with three other actions', () => {
		const { queryByText, queryByLabelText, debug } = render(
			<Form initialValues={ {} }>
				<ProductFormActions />
			</Form>
		);
		queryByLabelText( 'Publish options' )?.click();
		expect( queryByText( 'Publish & duplicate' ) ).toBeInTheDocument();
		expect( queryByText( 'Copy to a new draft' ) ).toBeInTheDocument();
		expect( queryByText( 'Move to trash' ) ).toBeInTheDocument();
	} );

	describe( 'with new product', () => {
		it( 'should trigger createProductWithStatus and the product_edit track when Save draft is clicked', () => {
			const product = { name: 'Name' };
			const { queryByText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			queryByText( 'Save draft' )?.click();
			expect( createProductWithStatus ).toHaveBeenCalledWith(
				product,
				'draft'
			);
			expect( recordEvent ).toHaveBeenCalledWith( 'product_edit', {
				new_product_page: true,
				product_id: undefined,
				product_type: undefined,
				is_downloadable: undefined,
				is_virtual: undefined,
				manage_stock: undefined,
			} );
		} );

		it( 'should trigger createProductWithStatus and the product_update track when Publish is clicked', () => {
			const product = { name: 'Name' };
			const { queryByText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			queryByText( 'Publish' )?.click();
			expect( createProductWithStatus ).toHaveBeenCalledWith(
				product,
				'publish'
			);
			expect( recordEvent ).toHaveBeenCalledWith( 'product_update', {
				new_product_page: true,
				product_id: undefined,
				product_type: undefined,
				is_downloadable: undefined,
				is_virtual: undefined,
				manage_stock: undefined,
			} );
		} );

		it( 'should have the Preview button disabled', () => {
			const product = { name: 'Name' };
			const { queryByText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			const previewButton = queryByText( 'Preview' );
			expect( ( previewButton as HTMLButtonElement ).disabled ).toEqual(
				true
			);
		} );

		it( 'should have the Move to trash button disabled', () => {
			const product = { name: 'Name' };
			const { queryByText, queryByLabelText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			queryByLabelText( 'Publish options' )?.click();
			const moveToTrashButton = queryByText( 'Move to trash' );
			expect(
				( moveToTrashButton?.parentElement as HTMLButtonElement )
					.disabled
			).toEqual( true );
		} );
	} );

	describe( 'with existing product', () => {
		it( 'The publish button should be renamed to Update when product is published', () => {
			const { queryByText } = render(
				<Form< Partial< Product > >
					initialValues={ { id: 5, name: 'test', status: 'publish' } }
				>
					<ProductFormActions />
				</Form>
			);
			expect( queryByText( 'Update' ) ).toBeInTheDocument();
		} );

		it( 'should trigger updateProductWithStatus and the product_edit track when Save draft is clicked', () => {
			const product: Partial< Product > = {
				id: 5,
				name: 'Name',
				type: 'simple',
				status: 'draft',
				downloadable: false,
				virtual: false,
				manage_stock: true,
			};
			const { queryByText, getByLabelText } = render(
				<Form< Partial< Product > > initialValues={ product }>
					{ ( { getInputProps }: FormContext< Product > ) => {
						return (
							<>
								<label htmlFor="product-name">Name</label>
								<input
									id="product-name"
									name="name"
									{ ...getInputProps< string >( 'name' ) }
								/>
								<ProductFormActions />
							</>
						);
					} }
				</Form>
			);
			userEvent.type(
				getByLabelText( 'Name' ),
				'{esc}{space}Update',
				{}
			);
			queryByText( 'Save draft' )?.click();
			expect( updateProductWithStatus ).toHaveBeenCalledWith(
				product.id,
				{ ...product, name: 'Name Update' },
				'draft'
			);
			expect( recordEvent ).toHaveBeenCalledWith( 'product_edit', {
				new_product_page: true,
				product_id: 5,
				product_type: 'simple',
				is_downloadable: false,
				is_virtual: false,
				manage_stock: true,
			} );
		} );

		it( 'should trigger updateProductWithStatus and the product_update track when Publish is clicked', () => {
			const product: Partial< Product > = {
				id: 5,
				name: 'Name',
				type: 'simple',
				status: 'draft',
				downloadable: false,
				virtual: false,
				manage_stock: true,
			};
			const { queryByText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			const publishButton = queryByText( 'Publish' );
			expect( ( publishButton as HTMLButtonElement ).disabled ).toEqual(
				false
			);
			publishButton?.click();
			expect( recordEvent ).toHaveBeenCalledWith( 'product_update', {
				new_product_page: true,
				product_id: 5,
				product_type: 'simple',
				is_downloadable: false,
				is_virtual: false,
				manage_stock: true,
			} );
			expect( updateProductWithStatus ).toHaveBeenCalledWith(
				product.id,
				product,
				'publish'
			);
		} );

		it( 'should disable publish/update button when product is published and not dirty', () => {
			const product: Partial< Product > = {
				id: 5,
				name: 'Name',
				type: 'simple',
				status: 'publish',
				downloadable: false,
				virtual: false,
				manage_stock: true,
			};
			const { queryByText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			const publishButton = queryByText( 'Update' );
			expect( ( publishButton as HTMLButtonElement ).disabled ).toEqual(
				true
			);
		} );

		it( 'should have the Preview button enabled', () => {
			const product: Partial< Product > = {
				id: 5,
				name: 'Name',
				type: 'simple',
				status: 'publish',
				downloadable: false,
				virtual: false,
				manage_stock: true,
				permalink: 'some_permalink',
			};
			const { queryByText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			const previewButton = queryByText( 'Preview' );
			expect( ( previewButton as HTMLButtonElement ).disabled ).toEqual(
				undefined
			);
		} );

		it( 'should trigger the product_preview_changes track when Preview is clicked', () => {
			const product: Partial< Product > = {
				id: 5,
				name: 'Name',
				type: 'simple',
				status: 'publish',
				downloadable: false,
				virtual: false,
				manage_stock: true,
				permalink: 'some_permalink',
			};
			const { queryByText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			const previewButton = queryByText( 'Preview' );
			previewButton?.click();
			expect( recordEvent ).toHaveBeenCalledWith(
				'product_preview_changes',
				{
					new_product_page: true,
					product_id: 5,
					product_type: 'simple',
					is_downloadable: false,
					is_virtual: false,
					manage_stock: true,
				}
			);
		} );

		it( 'should have the Move to trash button enabled and trigger the product_delete track and deleteProductAndRedirect function', () => {
			const product: Partial< Product > = {
				id: 5,
				name: 'Name',
				type: 'simple',
				status: 'publish',
				downloadable: false,
				virtual: false,
				manage_stock: true,
				permalink: 'some_permalink',
			};
			const { queryByText, queryByLabelText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			queryByLabelText( 'Publish options' )?.click();
			const moveToTrashButton = queryByText( 'Move to trash' );
			expect(
				( moveToTrashButton?.parentElement as HTMLButtonElement )
					.disabled
			).toEqual( false );
			moveToTrashButton?.click();
			expect( recordEvent ).toHaveBeenCalledWith( 'product_delete', {
				new_product_page: true,
				product_id: 5,
				product_type: 'simple',
				is_downloadable: false,
				is_virtual: false,
				manage_stock: true,
			} );
			expect( deleteProductAndRedirect ).toHaveBeenCalledWith(
				product.id
			);
		} );

		it( 'should trigger updateProductWithStatus and copyProductWithStatus when Update & duplicate is clicked', async () => {
			const product: Partial< Product > = {
				id: 5,
				name: 'Name',
				type: 'simple',
				status: 'publish',
				downloadable: false,
				virtual: false,
				manage_stock: true,
				permalink: 'some_permalink',
			};
			const { queryByText, queryByLabelText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			queryByLabelText( 'Publish options' )?.click();
			const publishAndDuplicateButton =
				queryByText( 'Update & duplicate' );
			publishAndDuplicateButton?.click();
			expect( recordEvent ).toHaveBeenCalledWith(
				'product_publish_and_copy',
				{
					new_product_page: true,
					product_id: 5,
					product_type: 'simple',
					is_downloadable: false,
					is_virtual: false,
					manage_stock: true,
				}
			);
			updateProductWithStatus.mockReturnValue( Promise.resolve() );
			expect( updateProductWithStatus ).toHaveBeenCalledWith(
				product.id,
				product,
				'publish'
			);
			await waitFor( () =>
				expect( copyProductWithStatus ).toHaveBeenCalledWith( product )
			);
		} );

		it( 'should trigger updateProductWithStatus and copyProductWithStatus when Copy to a new draft is clicked', async () => {
			const product: Partial< Product > = {
				id: 5,
				name: 'Name',
				type: 'simple',
				status: 'publish',
				downloadable: false,
				virtual: false,
				manage_stock: true,
				permalink: 'some_permalink',
			};
			const { queryByText, queryByLabelText } = render(
				<Form initialValues={ product }>
					<ProductFormActions />
				</Form>
			);
			queryByLabelText( 'Publish options' )?.click();
			const copyToANewDraftButton = queryByText( 'Copy to a new draft' );
			copyToANewDraftButton?.click();
			expect( recordEvent ).toHaveBeenCalledWith( 'product_copy', {
				new_product_page: true,
				product_id: 5,
				product_type: 'simple',
				is_downloadable: false,
				is_virtual: false,
				manage_stock: true,
			} );
			updateProductWithStatus.mockReturnValue( Promise.resolve() );
			expect( updateProductWithStatus ).toHaveBeenCalledWith(
				product.id,
				product,
				'publish'
			);
			await waitFor( () =>
				expect( copyProductWithStatus ).toHaveBeenCalledWith( product )
			);
		} );
	} );
} );

describe( 'Validations', () => {
	it( 'should not allow an empty product name', () => {
		const nameErrorMessage = 'This field is required.';
		const priceErrorMessage =
			'Please enter a price with one monetary decimal point without thousand separators and currency symbols.';
		const salePriceErrorMessage =
			'Please enter a price with one monetary decimal point without thousand separators and currency symbols.';
		const productWithoutName: Partial< Product > = {
			name: '',
		};
		const productPriceWithText: Partial< Product > = {
			name: 'My Product',
			regular_price: 'text',
		};
		const productPriceWithNotAllowedCharacters: Partial< Product > = {
			name: 'My Product',
			regular_price: '%&@#¢∞¬÷200',
		};
		const productPriceWithSpaces: Partial< Product > = {
			name: 'My Product',
			regular_price: '2 0 0',
		};
		const productSalePriceWithText: Partial< Product > = {
			name: 'My Product',
			sale_price: 'text',
		};
		const productSalePriceWithNotAllowedCharacters: Partial< Product > = {
			name: 'My Product',
			sale_price: '%&@#¢∞¬÷200',
		};
		const productSalePriceWithSpaces: Partial< Product > = {
			name: 'My Product',
			sale_price: '2 0 0',
		};
		const validProduct: Partial< Product > = {
			name: 'My Product',
			regular_price: '200',
			sale_price: '199',
		};
		expect( validate( productWithoutName ) ).toEqual( {
			name: nameErrorMessage,
		} );
		expect( validate( productPriceWithText ) ).toEqual( {
			regular_price: priceErrorMessage,
		} );
		expect( validate( productPriceWithNotAllowedCharacters ) ).toEqual( {
			regular_price: priceErrorMessage,
		} );
		expect( validate( productPriceWithSpaces ) ).toEqual( {
			regular_price: priceErrorMessage,
		} );

		expect( validate( productSalePriceWithText ) ).toEqual( {
			sale_price: salePriceErrorMessage,
		} );
		expect( validate( productSalePriceWithNotAllowedCharacters ) ).toEqual(
			{
				sale_price: salePriceErrorMessage,
			}
		);
		expect( validate( productSalePriceWithSpaces ) ).toEqual( {
			sale_price: salePriceErrorMessage,
		} );
		expect( validate( validProduct ) ).toEqual( {} );
	} );
} );
