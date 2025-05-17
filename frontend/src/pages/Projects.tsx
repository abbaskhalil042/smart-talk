import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { getWebContainer } from "../config/webcontainer";
import { UserAuthContext } from "../context/userAuth";
import { Plus, Send, Users, X } from "lucide-react";
import axiosInstance from "../config/axios";

// Type definitions
interface User {
  _id: string;
  email: string;
}

interface FileContent {
  file: {
    contents: string;
  };
}

interface FileTree {
  [key: string]: FileContent;
}

interface AIMessage {
  text?: string;
  fileTree?: FileTree;
  [key: string]: any;
}

interface Message {
  sender: User | { _id: string; email: string };
  message: string | AIMessage;
}

interface Project {
  _id: string;
  name: string;
  users: User[];
  fileTree?: FileTree;
}

interface SyntaxHighlightedCodeProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
  language?: string;
}

const SyntaxHighlightedCode: React.FC<SyntaxHighlightedCodeProps> = ({
  className,
  children,
  language,
  ...props
}) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && hljs?.highlightElement) {
      if (className?.includes("lang-") || language) {
        hljs.highlightElement(ref.current);
      }
    }
  }, [className, children, language]);

  return (
    <code
      {...props}
      ref={ref}
      className={className || (language ? `language-${language}` : "")}
    >
      {children}
    </code>
  );
};

const Projects: React.FC = () => {
  const location = useLocation();
  const { user } = useContext(UserAuthContext);
  const navigate = useNavigate();

  const projectFromState = location.state?.project as Project | undefined;

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Set<string>>(new Set());
  const [project, setProject] = useState<Project | null>(
    projectFromState || null
  );
  const [message, setMessage] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileTree, setFileTree] = useState<FileTree>(
    projectFromState?.fileTree || {}
  );
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [webContainerInstance, setWebContainerInstance] = useState<any>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [runProcess, setRunProcess] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editorContent, setEditorContent] = useState<string>("");

  const messageBoxRef = useRef<HTMLDivElement>(null);
  const webContainerListenerRef = useRef<any>(null);

  // Handle new messages from socket
  const handleNewMessage = useCallback((data: Message) => {
    console.log("Received message:", data);

    if (data.sender._id === "ai") {
      try {
        let aiResponse: AIMessage =
          typeof data.message === "string"
            ? JSON.parse(data.message)
            : (data.message as AIMessage);

        // Always update the file tree if present
        if (aiResponse.fileTree) {
          console.log("AI updated fileTree:", aiResponse.fileTree);
          setFileTree((prev) => ({ ...prev, ...aiResponse.fileTree }));
        }

        // Handle both text and fileTree updates
        const displayMessage =
          aiResponse.text ||
          (aiResponse.fileTree
            ? "Updated file structure"
            : JSON.stringify(aiResponse, null, 2));

        setMessages((prev) => [
          ...prev,
          {
            ...data,
            message: displayMessage,
          },
        ]);
      } catch (err) {
        console.error("Error processing AI message:", err);
        const fallbackMessage =
          typeof data.message === "string"
            ? data.message
            : "AI generated content (unable to parse).";
        setMessages((prev) => [...prev, { ...data, message: fallbackMessage }]);
      }
    } else {
      setMessages((prev) => [...prev, data]);
    }
  }, []);

  // Initialize WebContainer
  useEffect(() => {
    const initWebContainer = async () => {
      if (!webContainerInstance) {
        try {
          console.log("Initializing WebContainer...");
          const container = await getWebContainer();
          setWebContainerInstance(container);
          console.log("WebContainer initialized.");
        } catch (err) {
          console.error("Error initializing WebContainer:", err);
        }
      }
    };
    initWebContainer();

    return () => {
      if (
        webContainerInstance &&
        typeof webContainerInstance.dispose === "function"
      ) {
        webContainerInstance.dispose();
      }
    };
  }, []);

  // Fetch project details and users
  useEffect(() => {
    if (!projectFromState?._id) return;
    setIsLoading(true);

    // Update your fetchData function in the useEffect
    const fetchData = async () => {
      try {
        const [projectRes, usersRes] = await Promise.all([
          axiosInstance.get(`/projects/get-project/${projectFromState._id}`),
          axiosInstance.get("/users/all"),
        ]);

        setProject(projectRes.data.project);
        setFileTree(projectRes.data.project.fileTree || {});
        setAllUsers(
          usersRes.data.users.filter((u: User) => u._id !== user?._id)
        );

        // Load saved messages
        if (projectRes.data.project.messages) {
          setMessages(projectRes.data.project.messages);
        }

        if (
          !currentFile &&
          Object.keys(projectRes.data.project.fileTree || {}).length > 0
        ) {
          const firstFileName = Object.keys(
            projectRes.data.project.fileTree
          )[0];
          setCurrentFile(firstFileName);
          setOpenFiles([firstFileName]);
          setEditorContent(
            projectRes.data.project.fileTree[firstFileName]?.file?.contents ||
              ""
          );
        }
      } catch (err) {
        console.error("Error fetching project data or users:", err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectFromState?._id, navigate, user?._id]);

  // Initialize socket connection
  useEffect(() => {
    if (!project?._id || !user?._id) return;

    console.log(`Initializing socket for project: ${project._id}`);
    const socket = initializeSocket(project._id, user._id);
    const unregisterMessageHandler = receiveMessage(
      "project-message",
      handleNewMessage
    );

    return () => {
      console.log(`Cleaning up socket for project: ${project._id}`);
      if (typeof unregisterMessageHandler === "function") {
        unregisterMessageHandler();
      }
      if (typeof socket?.disconnect === "function") {
        socket.disconnect();
      }
      console.log("Socket message listener detached and socket disconnected.");
    };
  }, [project?._id, user?._id, handleNewMessage]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Update editor content when file changes
  useEffect(() => {
    if (currentFile && fileTree[currentFile]) {
      setEditorContent(fileTree[currentFile].file.contents);
    } else {
      setEditorContent("");
    }
  }, [currentFile, fileTree]);

  const handleUserClick = useCallback((id: string) => {
    setSelectedUserId((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const addCollaborators = useCallback(async () => {
    if (!project?._id || selectedUserId.size === 0) return;
    try {
      await axiosInstance.put("/projects/add-user", {
        projectId: project._id,
        users: Array.from(selectedUserId),
      });

      const updatedUsers = allUsers.filter((u) => selectedUserId.has(u._id));
      setProject((prev) =>
        prev ? { ...prev, users: [...prev.users, ...updatedUsers] } : null
      );
      setSelectedUserId(new Set());
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding collaborators:", err);
    }
  }, [project?._id, selectedUserId, allUsers]);

  const sendMessageHandler = useCallback(() => {
    if (!user || !message.trim() || !project?._id) return;

    const newMessage: Message = {
      sender: user,
      message: message.trim(),
      projectId: project._id, // Include project ID for backend
    };

    sendMessage("project-message", newMessage, project._id);
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  }, [user, message, project?._id]);

  const saveFileTree = useCallback(
    async (updatedFt: FileTree) => {
      if (!project?._id) return;
      try {
        await axiosInstance.put("/projects/update-file-tree", {
          projectId: project._id,
          fileTree: updatedFt,
        });
        console.log("File tree saved successfully.");
      } catch (err) {
        console.error("Error saving file tree:", err);
      }
    },
    [project?._id]
  );

  const handleFileContentChange = useCallback(
    (file: string, content: string) => {
      const updatedFileTree = {
        ...fileTree,
        [file]: { file: { contents: content } },
      };
      setFileTree(updatedFileTree);
      setEditorContent(content);
      saveFileTree(updatedFileTree);
    },
    [fileTree, saveFileTree]
  );

  const runProject = useCallback(async () => {
    if (!webContainerInstance || Object.keys(fileTree).length === 0) {
      console.warn("WebContainer not ready or file tree is empty.");
      return;
    }

    console.log("Attempting to run project...");
    setIframeUrl(null);

    try {
      console.log("Mounting files:", fileTree);
      await webContainerInstance.mount(fileTree);

      if (runProcess) {
        console.log("Killing previous run process...");
        runProcess.kill();
        setRunProcess(null);
      }

      console.log("Installing dependencies...");
      const installProcess = await webContainerInstance.spawn("npm", [
        "install",
      ]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log("Install:", data);
          },
        })
      );
      const installExitCode = await installProcess.exit;
      if (installExitCode !== 0)
        throw new Error(`npm install failed with code ${installExitCode}`);

      console.log("Starting project...");
      const newRunProcess = await webContainerInstance.spawn("npm", ["start"]);
      setRunProcess(newRunProcess);

      newRunProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log("Run:", data);
          },
        })
      );

      if (webContainerListenerRef.current) {
        webContainerInstance.off(
          "server-ready",
          webContainerListenerRef.current
        );
      }

      webContainerListenerRef.current = (port: number, url: string) => {
        console.log(`Server ready at: ${url}`);
        setIframeUrl(url);
      };
      webContainerInstance.on("server-ready", webContainerListenerRef.current);
    } catch (err) {
      console.error("Error running project:", err);
    }
  }, [webContainerInstance, fileTree, runProcess]);

  const getLanguageFromFilename = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      css: "css",
      html: "html",
      json: "json",
      md: "markdown",
    };
    return languageMap[extension] || extension;
  };

  const renderAiMessage = (messageContent: string | AIMessage) => {
    const content =
      typeof messageContent === "string"
        ? messageContent
        : JSON.stringify(messageContent, null, 2);

    return (
      <div className="overflow-auto bg-slate-900 text-white rounded-sm p-2 text-sm">
        <Markdown
          options={{
            overrides: {
              code: ({ className, children }) => (
                <SyntaxHighlightedCode
                  className={className}
                  language={className?.replace("lang-", "")}
                >
                  {children}
                </SyntaxHighlightedCode>
              ),
            },
          }}
        >
          {content}
        </Markdown>
      </div>
    );
  };

  const renderMessage = (msg: Message, index: number) => (
    <div
      key={index}
      className={`flex flex-col p-2 bg-slate-50 w-fit rounded-md shadow ${
        msg.sender._id === "ai" ? "max-w-md" : "max-w-xs"
      } ${
        msg.sender._id === user?._id
          ? "ml-auto bg-blue-100"
          : "mr-auto bg-gray-100"
      }`}
    >
      <small className="opacity-75 text-xs mb-1">
        {msg.sender.email} {msg.sender._id === "ai" && "(AI Assistant)"}
      </small>
      <div className="text-sm">
        {msg.sender._id === "ai" ? (
          renderAiMessage(msg.message)
        ) : (
          <p>{msg.message as string}</p>
        )}
      </div>
    </div>
  );

  const renderUser = (u: User, index: number) => (
    <div
      key={index}
      className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-3 items-center rounded"
      onClick={() => handleUserClick(u._id)}
    >
      <div className="aspect-square rounded-full w-10 h-10 flex items-center justify-center text-white bg-slate-600 text-sm">
        {/* {u.email[0]?.toUpperCase()} */}
        {/* {u.email.split("@")[0][0].toUpperCase()} */}
        {u.email}
      </div>
      <h1 className="font-semibold text-md">{u.email}</h1>
    </div>
  );

  const renderFile = (fileName: string, index: number) => (
    <button
      key={index}
      onClick={() => {
        setCurrentFile(fileName);
        if (!openFiles.includes(fileName)) {
          setOpenFiles((prev) => [...prev, fileName]);
        }
      }}
      className={`tree-element text-left cursor-pointer p-2 px-4 flex items-center gap-2 w-full hover:bg-slate-300 ${
        currentFile === fileName ? "bg-slate-400 font-semibold" : "bg-slate-200"
      }`}
    >
      <p className="text-sm">{fileName}</p>
    </button>
  );

  const renderOpenFileTab = (fileName: string, index: number) => (
    <div
      key={index}
      className={`open-file-tab flex items-center cursor-pointer px-3 py-2 text-sm ${
        currentFile === fileName
          ? "bg-slate-100 border-b-2 border-blue-500"
          : "bg-slate-300 hover:bg-slate-300/80"
      }`}
    >
      <button
        onClick={() => setCurrentFile(fileName)}
        className="mr-2 focus:outline-none"
      >
        {fileName}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpenFiles((prev) => prev.filter((f) => f !== fileName));
          if (currentFile === fileName) {
            setCurrentFile(openFiles.filter((f) => f !== fileName)[0] || null);
          }
        }}
        className="p-0.5 hover:bg-red-500 hover:text-white rounded-full text-xs"
      >
        <X size={14} />
      </button>
    </div>
  );

  if (isLoading && !project)
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        Loading Project...
      </div>
    );
  if (!project || !user)
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        Error loading project or user data.
      </div>
    );

  return (
    <main className="h-screen w-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel - Chat & Collaborators */}
      <section className="left relative flex flex-col h-1/3 md:h-screen md:min-w-[384px] md:max-w-[384px] bg-slate-200 border-r border-slate-400">
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-100 border-b border-slate-300">
          <button
            className="flex gap-2 items-center cursor-pointer p-1 hover:bg-slate-200 rounded"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <p className="text-sm">Add Collaborator</p>
          </button>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-0 cursor-pointer hover:bg-slate-200 rounded"
            title="Toggle Collaborators Panel"
          >
            <Users size={16} />
          </button>
        </header>

        <div className="conversation-area flex-grow flex flex-col h-full relative overflow-hidden">
          <div
            ref={messageBoxRef}
            className="message-box p-3 flex-grow flex flex-col gap-3 overflow-y-auto"
          >
            {messages.map(renderMessage)}
          </div>

          <div className="inputField w-full flex bg-gray-300 p-2 border-t border-slate-400">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessageHandler()}
              className="p-2 px-4 border border-slate-400 rounded-l-md outline-none flex-grow text-sm"
              type="text"
              placeholder="Enter message..."
            />
            <button
              onClick={sendMessageHandler}
              className="px-4 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
              disabled={!message.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Side Panel - Collaborators List */}
        <div
          className={`sidePanel absolute top-0 left-0 w-full h-full flex flex-col gap-2 bg-slate-50 shadow-lg transition-transform duration-300 ease-in-out ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <header className="flex justify-between items-center px-4 p-3 bg-slate-200 border-b border-slate-300">
            <h1 className="font-semibold text-md">Collaborators</h1>
            <button
              onClick={() => setIsSidePanelOpen(false)}
              className="p-2 hover:bg-slate-300 rounded"
            >
              <X size={18} />
            </button>
          </header>
          <div className="users p-2 flex flex-col gap-1 overflow-y-auto">
            {project.users.map(renderUser)}
          </div>
        </div>
      </section>

      {/* Middle Panel - Code Editor & File Explorer */}
      <section className="right flex-grow h-2/3 md:h-full flex overflow-hidden">
        <div className="explorer h-full min-w-[200px] max-w-[250px] bg-slate-100 border-r border-slate-300 overflow-y-auto">
          <h2 className="p-3 px-4 text-sm font-semibold border-b border-slate-300 bg-slate-200">
            File Explorer
          </h2>
          <div className="file-tree w-full">
            {Object.keys(fileTree).length > 0 ? (
              Object.keys(fileTree).map(renderFile)
            ) : (
              <p className="p-4 text-xs text-slate-500">
                No files in this project yet.
              </p>
            )}
          </div>
        </div>

        <div className="code-editor flex flex-col flex-grow h-full">
          <div className="top-bar flex justify-between items-center w-full bg-slate-200 border-b border-slate-300">
            <div className="open-files-tabs flex overflow-x-auto">
              {openFiles.map(renderOpenFileTab)}
            </div>
            <div className="actions flex gap-2 p-1.5">
              <button
                onClick={runProject}
                disabled={
                  !webContainerInstance || Object.keys(fileTree).length === 0
                }
                className="p-1.5 px-3 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                Run Project
              </button>
            </div>
          </div>

          <div className="editor-content-area flex-grow relative bg-white overflow-hidden">
            {currentFile && fileTree[currentFile] ? (
              <pre className="hljs h-full w-full relative">
                <code
                  className={`language-${getLanguageFromFilename(
                    currentFile
                  )} h-full w-full block overflow-auto p-4 text-sm outline-none focus:outline-none whitespace-pre-wrap break-all`}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    handleFileContentChange(
                      currentFile,
                      e.currentTarget.innerText
                    )
                  }
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(editorContent, {
                      language: getLanguageFromFilename(currentFile),
                      ignoreIllegals: true,
                    }).value,
                  }}
                  style={{
                    tabSize: 4,
                  }}
                />
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                {isLoading
                  ? "Loading file..."
                  : "Select a file to view or edit."}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Rightmost Panel - Preview */}
      {iframeUrl && (
        <section className="preview-panel flex flex-col h-1/3 md:h-full md:min-w-[350px] lg:min-w-[450px] border-l border-slate-400 bg-slate-50">
          <div className="address-bar p-2 bg-slate-200 border-b border-slate-300">
            <input
              type="text"
              readOnly
              value={iframeUrl}
              className="w-full p-1.5 px-3 bg-white border border-slate-300 rounded text-xs"
            />
          </div>
          <iframe
            src={iframeUrl}
            className="w-full h-full border-none"
            title="Project Preview"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
          />
        </section>
      )}

      {/* Add Collaborator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-5 rounded-lg shadow-xl w-full max-w-md relative">
            <header className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-lg font-semibold">Select Users to Add</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedUserId(new Set());
                }}
                className="p-1 hover:bg-slate-200 rounded-full"
              >
                <X size={20} />
              </button>
            </header>
            <div className="users-list flex flex-col gap-2 mb-4 max-h-80 overflow-y-auto">
              {allUsers.length > 0 ? (
                allUsers
                  .filter((u) => !project.users.find((pu) => pu._id === u._id))
                  .map((u) => (
                    <div
                      key={u._id}
                      className={`user cursor-pointer hover:bg-slate-100 ${
                        selectedUserId.has(u._id)
                          ? "bg-blue-100 ring-2 ring-blue-400"
                          : ""
                      } p-2 flex gap-3 items-center rounded transition-all`}
                      onClick={() => handleUserClick(u._id)}
                    >
                      <div className="aspect-square rounded-full w-10 h-10 flex items-center justify-center text-white bg-slate-500 text-sm">
                        {u.email.substring(0, 2).toUpperCase()}
                      </div>
                      <h1 className="font-medium text-sm">{u.email}</h1>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-slate-500">
                  No other users available or all are already collaborators.
                </p>
              )}
            </div>
            <footer className="pt-3 border-t">
              <button
                onClick={addCollaborators}
                disabled={selectedUserId.size === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                Add Collaborator(s)
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
};

export default Projects;
