import React, { useRef, useState } from "react";
import { Input, Table, Select, Radio } from "antd";
import { toast } from "react-toastify";
import { parse } from "papaparse";
import search from "../assets/search.svg";
const { Option } = Select;

const TransactionSearch = ({
  transactions,
  addTransaction,
  fetchTransactions,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState("");
  
  // Import CSV Function
  const importFromCsv = (event) => {
    const file = event.target.files[0];
    
    // Ensure a file is selected
    if (!file) {
      toast.error("No file selected.");
      return;
    }

    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("Parsed CSV Data:", results.data); // Log the parsed data
        const importedTransactions = results.data.map((transaction) => ({
          name: transaction.name,
          type: transaction.type,
          date: transaction.date,
          amount: parseFloat(transaction.amount), // Ensure it's a number
          tag: transaction.tag,
        }));

        try {
          for (const transaction of importedTransactions) {
            if (
              transaction.name && 
              transaction.type && 
              transaction.date && 
              !isNaN(transaction.amount)
            ) {
              await addTransaction(transaction); // Add each transaction
            } else {
              console.warn(`Invalid transaction data:`, transaction);
              toast.error(`Invalid transaction data: ${JSON.stringify(transaction)}`);
            }
          }
          toast.success("Transactions imported successfully!");
          fetchTransactions(); // Refresh transactions after import
        } catch (error) {
          console.error("Error adding transactions:", error);
          toast.error(`Error adding transactions: ${error.message}`);
        }
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });

    event.target.value = ""; // Clear the file input after processing
  };

  // CSV Export Function
  const handleExportToCsv = () => {
    const csvData = transactions.map((transaction) => ({
      name: transaction.name,
      type: transaction.type,
      date: transaction.date,
      amount: transaction.amount,
      tag: transaction.tag,
    }));

    const csvContent = `data:text/csv;charset=utf-8,` + [
      ["Name", "Type", "Date", "Amount", "Tag"], // CSV Header
      ...csvData.map((transaction) =>
        [transaction.name, transaction.type, transaction.date, transaction.amount, transaction.tag].join(",")
      ),
    ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
  };

  // Table Columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Tag",
      dataIndex: "tag",
      key: "tag",
    },
  ];

  // Filters for search and filtering
  const filteredTransactions = transactions.filter((transaction) => {
    const searchMatch = searchTerm
      ? transaction.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const tagMatch = selectedTag ? transaction.tag === selectedTag : true;
    const typeMatch = typeFilter ? transaction.type === typeFilter : true;

    return searchMatch && tagMatch && typeMatch;
  });

  // Sorting by Date or Amount
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortKey === "date") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortKey === "amount") {
      return a.amount - b.amount;
    } else {
      return 0;
    }
  });

  const dataSource = sortedTransactions.map((transaction, index) => ({
    key: index,
    ...transaction,
  }));

  return (
    <div style={{ width: "100%", padding: "0rem 2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div className="input-flex">
          <img src={search} width="16" alt="search icon" />
          <input
            placeholder="Search by Name"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          className="select-input"
          onChange={(value) => setTypeFilter(value)}
          value={typeFilter}
          placeholder="Filter"
          allowClear
        >
          <Option value="">All</Option>
          <Option value="income">Income</Option>
          <Option value="expense">Expense</Option>
        </Select>
      </div>

      <div className="my-table">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: "1rem",
          }}
        >
          <h2>My Transactions</h2>

          <Radio.Group
            className="input-radio"
            onChange={(e) => setSortKey(e.target.value)}
            value={sortKey}
          >
            <Radio.Button value="">No Sort</Radio.Button>
            <Radio.Button value="date">Sort by Date</Radio.Button>
            <Radio.Button value="amount">Sort by Amount</Radio.Button>
          </Radio.Group>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              width: "400px",
            }}
          >
            <button className="btn" onClick={handleExportToCsv}>
              Export to CSV
            </button>
            <label htmlFor="file-csv" className="btn btn-blue">
              Import from CSV
            </label>
            <input
              onChange={importFromCsv}
              id="file-csv"
              type="file"
              accept=".csv"
              required
              style={{ display: "none" }}
            />
          </div>
        </div>

        <Table columns={columns} dataSource={dataSource} />
      </div>
    </div>
  );
};

export default TransactionSearch;
