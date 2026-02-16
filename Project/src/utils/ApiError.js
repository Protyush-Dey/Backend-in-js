class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors= [],
        Stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null;
        this.message = message;
        this.Success = false;
        this.errors = errors
    }
}
export { ApiError }