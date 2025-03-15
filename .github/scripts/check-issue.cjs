module.exports = async ({ github, context, issueNumber }) => {
  const { owner, repo } = context.repo;
  
  try {
    let designerUsername = null;

    console.log(`Checking issue #${issueNumber}`);
    const issue = await github.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
    
    // Check for UI label
    const hasUILabel = issue.data.labels.some(label => 
      label.name.toLowerCase().includes('ui') || 
      label.name.toLowerCase().includes('design')
    );

    console.log(`Has UI label: ${hasUILabel}`);
    
    if (!hasUILabel) {
      console.log("Issue does not have a UI label");
      return {
        hasUILabel: false,
        designerUsername: null
      };
    }
 
    const nodeIdResponse = await github.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
    
    const issueNodeId = nodeIdResponse.data.node_id;
    console.log(`Issue node ID: ${issueNodeId}`);
    
        // Now query the project items and their field values
    const projectItemQuery = `
         query {
          repository(owner: "${owner}", name: "${repo}") {
            issue(number: ${issueNumber}) {
              id
              title
              projectItems(first: 10) {
                nodes {
                  id
                  project {
                    id
                    title
                  }
                  fieldValues(first: 100) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        field {
                          ... on ProjectV2FieldCommon {
                            name
                          }
                        }
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }`;
    
        const projectItemResponse = await github.graphql(projectItemQuery);
        console.log("Project items:", JSON.stringify(projectItemResponse, null, 2));
        
      // Find the item for our specific issue
      const projectItems = projectItemResponse.repository.issue.projectItems.nodes;
      for (const item of projectItems) {

        const fieldValues = item.fieldValues.nodes;
        console.log("Field values:", JSON.stringify(fieldValues, null, 2));
          
          for (const fieldValue of fieldValues) {
            const fieldName = fieldValue.field?.name;
            console.log(`Field: ${fieldName}`);
            
            if (fieldName && fieldName.toLowerCase() === "designer attached") {
              // Handle different field types
              if (fieldValue.name) {
                designerUsername = fieldValue.name;
              } 
              console.log(`Found designer: ${designerUsername}`);
              break;
            }
          }
        }




    const result = {
      hasUILabel: true,
      designerUsername
    };
    
    console.log("Returning result:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return {
      hasUILabel: false,
      designerUsername: null
    };
  }
};