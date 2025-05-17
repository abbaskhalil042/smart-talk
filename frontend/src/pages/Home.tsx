import React, { useContext, useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
// import { UserAuthContext } from "../context/userAuth";
import axiosInstance from "../config/axios";

const Home = () => {
  // const { user } = useContext(UserAuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState<string>("");
  const [project, setProject] = useState([]);

  const navigate = useNavigate();

  async function createProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log({ projectName });

    const res = await axiosInstance.post("/api/v1/projects/create", {
      name: projectName,
    });

    console.log(res);
  }

  useEffect(() => {
    axiosInstance
      .get("/api/v1/projects/all")
      .then((res) => {
        setProject(res.data.projects);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <main className="p-4">
      <div className="projects flex flex-wrap gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="project p-4 border border-slate-300 rounded-md"
        >
          New Project
          <i className="ri-link ml-2"></i>
        </button>

        {project.map((project: any) => (
          <div
            key={project?._id}
            onClick={() => {
              navigate(`/project`, {
                state: { project },
              });
            }}
            className="project flex flex-col gap-2 cursor-pointer p-4 border border-slate-300 rounded-md min-w-52 hover:bg-slate-200"
          >
            <h2 className="font-semibold">{project?.name}</h2>

            <div className="flex gap-2">
              <p>
                <small>
                  <i className="ri-user-line"></i> Collaborators
                </small>
                :
              </p>
              {project.users.length}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-md w-1/3">
            <h2 className="text-xl mb-4">Create New Project</h2>
            <form onSubmit={createProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <input
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setProjectName(e.target.value)
                  }
                  value={projectName || ""}
                  type="text"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-gray-300 rounded-md cursor-pointer"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white cursor-pointer rounded-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
