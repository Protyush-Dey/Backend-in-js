import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const register = asyncHandler(async (req, res) => {
  // get user Detail frontend
  const { userName, email, fullName, password } = req.body;
  // cheak validation - is empty
  if (
    [userName, email, fullName, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fieds are required");
  }
  // is exist validtaion
  const existuser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existuser) {
    throw new ApiError(409, "Username or email already exist");
  }
  const avatarLocalpath = await req.files?.avatar[0]?.path;
  const coverImageLocalpath = await req.files?.coverImage[0]?.path;
  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverImage = await uploadOnCloudinary(coverImageLocalpath);
  if (!avatar) {throw new ApiError(400, "Avatar upload failed");}
  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while register");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "Register successfully"));
});
export { register };
