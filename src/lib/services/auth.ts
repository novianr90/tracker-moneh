import { supabase } from './supabase';

export const authService = {
	async signIn(email: string, password: string) {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
    if (error) throw error;
    console.log("data: " + JSON.stringify(data));
		return data;
	},

	async signOut() {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	},

	async getSession() {
		const { data, error } = await supabase.auth.getSession();
		if (error) throw error;
		return data.session;
	},

	async getUser() {
		const { data, error } = await supabase.auth.getUser();
		if (error) throw error;
		return data.user;
	}
};
