export interface AuthFormState {
  errorMessage: string | null;
  noticeMessage: string | null;
}

export const emptyAuthFormState: AuthFormState = {
  errorMessage: null,
  noticeMessage: null,
};
