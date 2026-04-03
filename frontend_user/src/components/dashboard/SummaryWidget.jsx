import { Card, CardContent, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const SummaryWidget = ({ tenantSlug }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/${tenantSlug}/ai/daily-summary/${user.username}`);
        const data = await response.json();
        setSummary(data.summary);
      } catch (error) {
        setSummary("Unable to load summary.");
      }
    };
    if (user) fetchSummary();
  }, [tenantSlug, user]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Daily Summary</Typography>
        <Typography variant="body1">{summary}</Typography>
      </CardContent>
    </Card>
  );
};

export default SummaryWidget;