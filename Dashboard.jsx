import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import UploadPDF from "../components/UploadPDF";
import PDFEditor from "../components/PDFEditor";
import { apiConnector } from "../services/apiConnector";
import { DOCUMENT_API, PUBLIC_SIGNATURE_API } from "../services/apis";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import {
  FaTrashAlt,
  FaFileSignature,
  FaPaperPlane,
  FaPlus,
} from "react-icons/fa";

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [docToRequest, setDocToRequest] = useState(null);

  const fetchDocuments = async () => {
    try {
      const res = await apiConnector("get", DOCUMENT_API.LIST, null, {
        withCredentials: true,
      });
      if (Array.isArray(res?.documents)) {
        setDocuments(res.documents);
      } else {
        toast.error("Unexpected response from server");
      }
    } catch (err) {
      toast.error("Failed to fetch documents");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter(
    (doc) => filterStatus === "All" || doc.status === filterStatus
  );

  const handleDelete = async (docId) => {
    try {
      await apiConnector("delete", DOCUMENT_API.DELETE(docId), null, {
        withCredentials: true,
      });
      setDocuments((prev) => prev.filter((doc) => doc._id !== docId));
      toast.success("Deleted successfully");
    } catch {
      toast.error("Delete failed");
    }
  };

  const sendSignatureLink = async () => {
    try {
      await apiConnector("post", PUBLIC_SIGNATURE_API.REQUEST_LINK, {
        documentId: docToRequest._id,
        email,
      });
      toast.success("Request sent");
    } catch {
      toast.error("Send failed");
    } finally {
      setEmail("");
      setShowEmailModal(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Filter */}
      <aside className="w-64 bg-white shadow p-4">
        <h3 className="font-semibold mb-4">Filter by Status</h3>
        {["All", "Pending", "Signed", "Rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`block w-full text-left px-4 py-2 rounded hover:bg-gray-200 ${
              filterStatus === status ? "bg-blue-100 font-bold" : ""
            }`}
          >
            {status}
          </button>
        ))}
        <div className="mt-6">
          <UploadPDF onUploadSuccess={fetchDocuments} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        <h2 className="text-2xl font-bold">Your Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg relative"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold truncate">{doc.filename}</h4>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    doc.status === "Signed"
                      ? "bg-green-100 text-green-700"
                      : doc.status === "Rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {doc.status}
                </span>
              </div>

              <div className="border border-gray-300 rounded h-48 overflow-hidden mb-3">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer fileUrl={`${SERVER_BASE_URL}/${doc.filepath}`} />
                </Worker>
              </div>

              <div className="flex justify-between gap-2 text-sm">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="flex-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDocToRequest(doc);
                    setShowEmailModal(true);
                  }}
                  className="flex-1 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  Request
                </button>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="flex-1 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* PDF Editor Panel */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-5xl">
            <PDFEditor document={selectedDoc} goBack={() => setSelectedDoc(null)} />
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow w-96">
            <h3 className="text-lg font-semibold mb-4">Send Signature Request</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Recipient's email"
              className="w-full px-3 py-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={sendSignatureLink}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <FaPaperPlane className="inline mr-1" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
