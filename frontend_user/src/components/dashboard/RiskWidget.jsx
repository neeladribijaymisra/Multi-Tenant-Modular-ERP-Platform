import { Card, CardContent, Typography, Chip, List, ListItem, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { getCollection } from "../../services/api";

const RiskWidget = ({ tenantSlug }) => {
  const [riskData, setRiskData] = useState([]);

  useEffect(() => {
    const fetchRiskData = async () => {
      // Fetch students and their risk analysis
      const students = await getCollection(tenantSlug, "students");
      const risks = await Promise.all(
        students.map(async (student) => {
          try {
            const response = await fetch(`/api/${tenantSlug}/ai/student-risk/${student.studentId}`);
            return await response.json();
          } catch {
            return null;
          }
        })
      );
      setRiskData(risks.filter(Boolean));
    };
    fetchRiskData();
  }, [tenantSlug]);

  const getRiskColor = (level) => {
    switch (level) {
      case "high": return "error";
      case "medium": return "warning";
      default: return "success";
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Student Risk Analysis</Typography>
        <List>
          {riskData.map((risk, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`Student ${risk.factors?.studentId || 'Unknown'}`}
                secondary={
                  <>
                    <Chip label={risk.riskLevel} color={getRiskColor(risk.riskLevel)} size="small" />
                    <Typography variant="body2">Score: {risk.riskScore}</Typography>
                    <Typography variant="body2">Recommendations: {risk.recommendations?.join(", ")}</Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default RiskWidget;