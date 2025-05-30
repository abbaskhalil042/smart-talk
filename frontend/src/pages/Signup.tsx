import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import z from "zod";
import axiosInstance from "../config/axios";
import { Loader2 } from "lucide-react";

const singupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormFields = z.infer<typeof singupSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(singupSchema) });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      const response = await axiosInstance.post(
        "/api/v1/auth/user/signup",
        data
      );
      const result = response.data;

      navigate("/signin");

      reset();
      console.log(result);
    } catch (error: Error | any) {
      setError("root", {
        message: error?.response?.data?.message || error.message,
      });
    }
  };
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="bg-[#1e293b] p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Create Account
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm text-gray-300">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              className="w-full px-4 py-3 bg-[#334155] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-300">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              className="w-full px-4 py-3 bg-[#334155] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {errors.root && (
            <p className="text-red-500 text-sm mt-2">{errors.root.message}</p>
          )}
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300"
          >
            Sign Up {isSubmitting && <Loader2 className="animate-spin" />}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-5">
          Already have an account?{" "}
          <Link to="/" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
