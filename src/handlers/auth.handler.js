import {
	registerUser,
	loginUser,
	refreshToken,
	logoutUser,
	getCurrentUser,
	updateProfile,
	addAddress,
	updateAddress,
	deleteAddress
} from '../services/auth.service.js';

export async function registerHandler(c) {
	return await registerUser(c);
}

export async function loginHandler(c) {
	return await loginUser(c);
}

export async function refreshHandler(c) {
	return await refreshToken(c);
}

export async function logoutHandler(c) {
	return await logoutUser(c);
}

export async function meHandler(c) {
	return await getCurrentUser(c);
}

export async function updateProfileHandler(c) {
	return await updateProfile(c);
}

export async function addAddressHandler(c) {
	return await addAddress(c);
}

export async function updateAddressHandler(c) {
	return await updateAddress(c);
}

export async function deleteAddressHandler(c) {
	return await deleteAddress(c);
}

